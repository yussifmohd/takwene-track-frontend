import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";

describe("routing", () => {
  it("renders Not found with a link home for unknown paths", async () => {
    const { user, router } = renderRoutes(routes, { route: "/no/such/page" });

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Go to status page" }));

    expect(router.state.location.pathname).toBe("/");
    expect(await screen.findByRole("heading", { name: "System status" })).toBeInTheDocument();
  });
});
