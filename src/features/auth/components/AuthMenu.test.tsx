import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { routes } from "@/router";
import { SESSION_STORAGE_KEY, useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, ADMIN_PASSWORD, currentUser, loginResponse, server } from "@/test/server";
import { signInForTest } from "@/test/session";

describe("AuthMenu", () => {
  it("offers Sign in with the current page as return address when signed out", () => {
    renderRoutes(routes, { route: "/" });

    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?redirect=%2F");
    expect(within(banner).queryByRole("link", { name: "My account" })).not.toBeInTheDocument();
  });

  it("shows the email, Sign out and the My account link when signed in", () => {
    signInForTest();
    renderRoutes(routes, { route: "/" });

    const banner = screen.getByRole("banner");
    expect(within(banner).getByText(ADMIN_EMAIL)).toBeInTheDocument();
    expect(within(banner).getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: "My account" })).toHaveAttribute("href", "/account");
  });

  it("Sign out on the status page goes to /login, clears session, storage and account cache, and confirms", async () => {
    const success = vi.spyOn(toast, "success").mockImplementation(() => "id");
    signInForTest();
    const { user, router, queryClient } = renderRoutes(routes, { route: "/" });
    queryClient.setQueryData(["auth", "me"], currentUser());

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(queryClient.getQueryCache().findAll({ queryKey: ["auth"] })).toHaveLength(0);
    expect(success).toHaveBeenCalledWith("Signed out");
    expect(success).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument(); // no "session ended" note for a manual sign-out
  });

  it("Sign out on the account page goes to /login in one click; account content is gone at once", async () => {
    vi.spyOn(toast, "success").mockImplementation(() => "id");
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
    const { user, router, queryClient } = renderRoutes(routes, { route: "/account" });
    await screen.findByRole("heading", { name: "Your account" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(screen.queryByRole("heading", { name: "Your account" })).not.toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe(""); // not "?redirect=%2Faccount": a manual sign-out starts fresh
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(queryClient.getQueryCache().findAll({ queryKey: ["auth"] })).toHaveLength(0);
    expect(useAuthStore.getState().signOutReason).toBeNull(); // handled once
  });

  it("after signing out and in again, the app goes to the status page", async () => {
    vi.spyOn(toast, "success").mockImplementation(() => "id");
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
    const { user, router } = renderRoutes(routes, { route: "/account" });
    await screen.findByRole("heading", { name: "Your account" });
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByLabelText("Email");
    server.use(http.post("*/api/auth/login", () => HttpResponse.json(loginResponse())));

    await user.type(screen.getByLabelText("Email"), ADMIN_EMAIL);
    await user.type(screen.getByLabelText("Password"), ADMIN_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
