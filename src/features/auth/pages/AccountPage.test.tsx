import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, currentUser, problem, server } from "@/test/server";
import { signInForTest } from "@/test/session";

describe("AccountPage", () => {
  it("shows a skeleton, then email, role and when the session ends", async () => {
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser(52))));

    renderRoutes(routes, { route: "/account" });

    expect(screen.getByLabelText("Loading account")).toBeInTheDocument();
    expect(await screen.findByText(ADMIN_EMAIL, { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Admin – can change the catalogue")).toBeInTheDocument();
    expect(screen.getByText(/\(in 5[01] minutes\)/)).toBeInTheDocument();
  });

  it("shows an error with Retry, and Retry loads the data", async () => {
    signInForTest();
    let fail = true;
    server.use(http.get("*/api/auth/me", () => (fail ? problem(500, { title: "Server error" }) : HttpResponse.json(currentUser()))));
    const { user } = renderRoutes(routes, { route: "/account" });

    // The query retries once before showing the error.
    expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toHaveTextContent("Server error");
    fail = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText(ADMIN_EMAIL, { selector: "dd" })).toBeInTheDocument();
  });
});
