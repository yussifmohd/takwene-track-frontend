import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { SESSION_STORAGE_KEY, useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { currentUser, problem, server } from "@/test/server";
import { signInForTest } from "@/test/session";

describe("SessionWatcher", () => {
  afterEach(() => vi.useRealTimers());

  it("signs out when the token expires and says why", async () => {
    const info = vi.spyOn(toast, "info").mockImplementation(() => "id");
    vi.useFakeTimers({ shouldAdvanceTime: true });
    signInForTest({ expiresAt: new Date(Date.now() + 5_000).toISOString() });
    renderRoutes(routes, { route: "/" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_100);
    });

    expect(useAuthStore.getState().session).toBeNull();
    expect(info).toHaveBeenCalledWith("Your session ended", { description: "Sign in again to make changes." });
    expect(info).toHaveBeenCalledTimes(1);
  });

  it("on a protected page, expiry leads to sign-in with the return address", async () => {
    vi.spyOn(toast, "info").mockImplementation(() => "id");
    vi.useFakeTimers({ shouldAdvanceTime: true });
    signInForTest({ expiresAt: new Date(Date.now() + 5_000).toISOString() });
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
    const { router } = renderRoutes(routes, { route: "/account" });
    await screen.findByRole("heading", { name: "Your account" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_100);
    });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Faccount");
  });

  it("a 401 from the API signs out, says the session is no longer valid and drops signed-in data", async () => {
    const warning = vi.spyOn(toast, "warning").mockImplementation(() => "id");
    const cleanup = setupAuth(window);
    signInForTest();
    server.use(http.get("*/api/auth/me", () => problem(401, { title: "Unauthorized" })));
    const { router, queryClient } = renderRoutes(routes, { route: "/account" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(useAuthStore.getState().session).toBeNull();
    expect(warning).toHaveBeenCalledWith("Your session is no longer valid", { description: "Sign in again to make changes." });
    await waitFor(() => expect(queryClient.getQueryCache().findAll({ queryKey: ["auth"] })).toHaveLength(0));
    cleanup();
  });

  it("follows a sign-out in another tab", async () => {
    const cleanup = setupAuth(window);
    signInForTest();
    renderRoutes(routes, { route: "/" });
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();

    act(() => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: null }));
    });

    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
    cleanup();
  });

  it("signs out on focus when the session expired while the tab was asleep", async () => {
    vi.spyOn(toast, "info").mockImplementation(() => "id");
    const session = signInForTest({ expiresAt: new Date(Date.now() + 60_000).toISOString() });
    renderRoutes(routes, { route: "/" });

    // Simulate a sleeping laptop: the clock jumped past expiry without the timer firing.
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(session.expiresAt) + 1_000);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(useAuthStore.getState().session).toBeNull();
    vi.restoreAllMocks();
  });
});
