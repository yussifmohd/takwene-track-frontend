import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { SESSION_STORAGE_KEY, useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, ADMIN_PASSWORD, currentUser, loginResponse, problem, server } from "@/test/server";
import { signInForTest } from "@/test/session";

describe("SessionWatcher", () => {
  afterEach(() => vi.useRealTimers());

  it("on the status page, expiry goes to sign-in with an explanation and the return address", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    signInForTest({ expiresAt: new Date(Date.now() + 5_000).toISOString() });
    const { router } = renderRoutes(routes, { route: "/" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_100);
    });

    expect(useAuthStore.getState().session).toBeNull();
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2F");
    expect(await screen.findByRole("status")).toHaveTextContent("Your session ended. Sign in again to continue.");
  });

  it("on a protected page, expiry goes to sign-in, explains, and the next sign-in returns there", async () => {
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
    expect(await screen.findByRole("status")).toHaveTextContent("Your session ended.");
    vi.useRealTimers();
    server.use(http.post("*/api/auth/login", () => HttpResponse.json(loginResponse())));

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), ADMIN_EMAIL);
    await user.type(screen.getByLabelText("Password"), ADMIN_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/account"));
  });

  it("a 401 from the API signs out, goes to sign-in with an explanation and drops signed-in data", async () => {
    const cleanup = setupAuth(window);
    signInForTest();
    server.use(http.get("*/api/auth/me", () => problem(401, { title: "Unauthorized" })));
    const { router, queryClient } = renderRoutes(routes, { route: "/account" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Faccount");
    expect(useAuthStore.getState().session).toBeNull();
    expect(await screen.findByRole("status")).toHaveTextContent("Your session is no longer valid. Sign in again to continue.");
    await waitFor(() => expect(queryClient.getQueryCache().findAll({ queryKey: ["auth"] })).toHaveLength(0));
    cleanup();
  });

  it("follows a sign-out in another tab: a public page stays, with a note", async () => {
    const info = vi.spyOn(toast, "info").mockImplementation(() => "id");
    const cleanup = setupAuth(window);
    signInForTest();
    const { router } = renderRoutes(routes, { route: "/" });
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();

    act(() => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: null }));
    });

    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(info).toHaveBeenCalledWith("You signed out in another tab");
    cleanup();
  });

  it("follows a sign-out in another tab: a protected page goes to sign-in with the return address", async () => {
    const cleanup = setupAuth(window);
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
    const { router } = renderRoutes(routes, { route: "/account" });
    await screen.findByRole("heading", { name: "Your account" });

    act(() => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: null }));
    });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Faccount");
    expect(await screen.findByRole("status")).toHaveTextContent("You signed out in another tab.");
    cleanup();
  });

  it("signs out on focus when the session expired while the tab was asleep", async () => {
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
