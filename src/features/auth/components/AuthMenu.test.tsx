import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { routes } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, currentUser, server } from "@/test/server";
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

  it("signing out on a protected page goes to the status page (not sign-in) and confirms", async () => {
    const success = vi.spyOn(toast, "success").mockImplementation(() => "id");
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
    const { user, router } = renderRoutes(routes, { route: "/account" });
    await screen.findByRole("heading", { name: "Your account" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(useAuthStore.getState().session).toBeNull();
    expect(success).toHaveBeenCalledWith("Signed out");
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  it("signing out on a public page stays there", async () => {
    vi.spyOn(toast, "success").mockImplementation(() => "id");
    signInForTest();
    const { user, router } = renderRoutes(routes, { route: "/" });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(router.state.location.pathname).toBe("/");
    expect(useAuthStore.getState().session).toBeNull();
  });
});
