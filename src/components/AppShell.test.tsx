import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { signInForTest } from "@/test/session";

describe("AppShell", () => {
  it("renders header, main navigation and content landmarks", async () => {
    renderRoutes(routes);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Status" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(await screen.findByRole("heading", { name: "System status" })).toBeInTheDocument();
  });

  it("marks Tracks and Artists as coming soon (not links)", () => {
    renderRoutes(routes);
    const nav = screen.getByRole("navigation", { name: "Main" });

    for (const label of ["Tracks", "Artists"]) {
      const item = within(nav).getByText(label, { exact: false });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(within(nav).queryByRole("link", { name: new RegExp(label) })).not.toBeInTheDocument();
    }
  });

  it("shows My account in the main navigation only when signed in", () => {
    signInForTest();
    renderRoutes(routes);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "My account" })).toHaveAttribute("href", "/account");
  });
});
