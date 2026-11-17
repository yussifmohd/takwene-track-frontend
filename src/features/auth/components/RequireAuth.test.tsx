import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, ADMIN_PASSWORD, currentUser, loginResponse, server } from "@/test/server";
import { signInForTest } from "@/test/session";

describe("RequireAuth", () => {
  it("sends a signed-out visitor to sign-in with the return address, then back after sign-in", async () => {
    server.use(
      http.post("*/api/auth/login", () => HttpResponse.json(loginResponse())),
      http.get("*/api/auth/me", () => HttpResponse.json(currentUser())),
    );
    const { router, user } = renderRoutes(routes, { route: "/account?tab=1" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Faccount%3Ftab%3D1");

    await user.type(screen.getByLabelText("Email"), ADMIN_EMAIL);
    await user.type(screen.getByLabelText("Password"), ADMIN_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe("/account?tab=1"));
  });

  it("shows the protected page to a signed-in user", async () => {
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));

    renderRoutes(routes, { route: "/account" });

    expect(await screen.findByRole("heading", { name: "Your account" })).toBeInTheDocument();
  });

  it("never guards the public status page", async () => {
    const { router } = renderRoutes(routes, { route: "/" });
    expect(await screen.findByRole("heading", { name: "System status" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("sends a signed-out visitor from Add artist to sign-in and back after sign-in", async () => {
    server.use(http.post("*/api/auth/login", () => HttpResponse.json(loginResponse())));
    const { router, user } = renderRoutes(routes, { route: "/artists/new" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Fartists%2Fnew");

    await user.type(screen.getByLabelText("Email"), ADMIN_EMAIL);
    await user.type(screen.getByLabelText("Password"), ADMIN_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/artists/new"));
    expect(await screen.findByRole("heading", { name: "Add artist" })).toBeInTheDocument();
  });

  it("tells a signed-in user without the Admin role that only admins can add artists", async () => {
    signInForTest({ roles: [] });
    renderRoutes(routes, { route: "/artists/new" });

    expect(screen.getByRole("heading", { name: "Only admins can add artists" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to artists" })).toHaveAttribute("href", "/artists");
  });

  it("does not require a role for pages without one", async () => {
    signInForTest({ roles: [] });
    server.use(http.get("*/api/auth/me", () => HttpResponse.json({ ...currentUser(), roles: [] })));
    renderRoutes(routes, { route: "/account" });
    expect(await screen.findByRole("heading", { name: "Your account" })).toBeInTheDocument();
  });
});
