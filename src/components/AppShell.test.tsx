import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { server, TRACK_ID, trackDetail } from "@/test/server";
import { signInForTest } from "@/test/session";

describe("AppShell", () => {
  it("renders header, main navigation and content landmarks", async () => {
    renderRoutes(routes);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Tracks" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(await screen.findByRole("heading", { name: "Tracks", level: 1 })).toBeInTheDocument();
  });

  it("links Tracks and Artists for everyone, with nothing marked coming soon", () => {
    renderRoutes(routes);
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(within(nav).getByRole("link", { name: "Tracks" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Artists" })).toHaveAttribute("href", "/artists");
    expect(within(nav).queryByText(/soon/)).not.toBeInTheDocument();
  });

  it("keeps Tracks current on a track's page", async () => {
    server.use(http.get("*/api/tracks/:id", () => HttpResponse.json(trackDetail())));
    renderRoutes(routes, { route: `/tracks/${TRACK_ID}` });
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(within(nav).getByRole("link", { name: "Tracks" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("heading", { name: "Tamally Maak" })).toBeInTheDocument();
  });

  it("shows My account in the main navigation only when signed in", () => {
    signInForTest();
    renderRoutes(routes);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "My account" })).toHaveAttribute("href", "/account");
  });
});
