import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Artist } from "@/api/artists";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { artistsHandler, problem, sampleArtists, server } from "@/test/server";
import { signInForTest } from "@/test/session";

function manyArtists(count: number): Artist[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    name: `Artist ${String(i + 1).padStart(2, "0")}`,
    countryCode: "SA",
    email: `a${i}@example.com`,
    createdAtUtc: "2026-11-17T09:00:00Z",
  }));
}

const table = () => screen.getByRole("table", { name: "Artists" });
const rowNames = () => within(table()).getAllByRole("rowheader").map((cell) => cell.textContent);

describe("ArtistsPage", () => {
  it("shows a placeholder, then names (dir=auto) with country names, without emails for visitors", async () => {
    server.use(artistsHandler());
    renderRoutes(routes, { route: "/artists" });

    expect(screen.getByRole("status")).toHaveTextContent("Loading artists");
    expect(await screen.findByRole("table", { name: "Artists" })).toBeInTheDocument();

    expect(rowNames()).toEqual(["Amr Diab", "Nancy عجرم", "عمرو دياب"]);
    const arabic = within(table()).getByText("عمرو دياب");
    expect(arabic).toHaveAttribute("dir", "auto");
    expect(within(table()).getAllByText("Egypt")).toHaveLength(2);
    expect(within(table()).getByText("Lebanon")).toBeInTheDocument();
    expect(screen.getByText("3 artists credited in the catalogue.")).toBeInTheDocument();

    expect(screen.queryByRole("columnheader", { name: "Email" })).not.toBeInTheDocument();
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add artist" })).not.toBeInTheDocument();
  });

  it("shows emails and the Add artist action to a signed-in admin", async () => {
    const cleanup = setupAuth(window);
    signInForTest();
    server.use(artistsHandler());
    renderRoutes(routes, { route: "/artists" });

    await screen.findByRole("table", { name: "Artists" });
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(within(table()).getByText("booking@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add artist" })).toHaveAttribute("href", "/artists/new");
    cleanup();
  });

  it("hides emails from a signed-in user without the Admin role, even if the response had them", async () => {
    signInForTest({ roles: [] });
    server.use(http.get("*/api/artists", () => HttpResponse.json({ items: sampleArtists, page: 1, pageSize: 20, totalCount: 3, totalPages: 1 })));
    renderRoutes(routes, { route: "/artists" });

    await screen.findByRole("table", { name: "Artists" });
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add artist" })).not.toBeInTheDocument();
  });

  it("pages through the URL: Next/Previous update ?page and disable at the ends", async () => {
    const requests: URL[] = [];
    server.use(artistsHandler(manyArtists(45), { requests }));
    const { user, router } = renderRoutes(routes, { route: "/artists" });

    await screen.findByText("Page 1 of 3");
    expect(rowNames()).toHaveLength(20);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(requests.at(-1)?.search).toBe("?page=1&pageSize=20");

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Page 2 of 3");
    expect(router.state.location.search).toBe("?page=2");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("2");

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Page 3 of 3");
    await waitFor(() => expect(rowNames()).toHaveLength(5));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByText("Page 2 of 3");
  });

  it("opens the page in the address and treats an invalid page as page 1", async () => {
    const requests: URL[] = [];
    server.use(artistsHandler(manyArtists(45), { requests }));
    const first = renderRoutes(routes, { route: "/artists?page=2" });
    await screen.findByText("Page 2 of 3");
    expect(rowNames()[0]).toBe("Artist 21");
    first.unmount();

    renderRoutes(routes, { route: "/artists?page=abc" });
    await screen.findByText("Page 1 of 3");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
  });

  it("a page past the end offers a way back to page 1", async () => {
    server.use(artistsHandler(manyArtists(3)));
    const { user, router } = renderRoutes(routes, { route: "/artists?page=7" });

    expect(await screen.findByText("This page is empty")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page 1" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(await screen.findByRole("table", { name: "Artists" })).toBeInTheDocument();
  });

  it("empty catalogue: visitors get a sentence, admins also the action", async () => {
    server.use(artistsHandler([]));
    const visitor = renderRoutes(routes, { route: "/artists" });
    expect(await screen.findByText("No artists yet")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add artist" })).not.toBeInTheDocument();
    visitor.unmount();

    signInForTest();
    renderRoutes(routes, { route: "/artists" });
    expect(await screen.findByText("No artists yet")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Add artist" })).toHaveLength(2);
  });

  it("shows an error with Retry, and Retry loads the list", async () => {
    let fail = true;
    server.use(http.get("*/api/artists", () => (fail ? problem(500, { title: "Server error", detail: "Try again later." }) : HttpResponse.json({ items: sampleArtists, page: 1, pageSize: 20, totalCount: 3, totalPages: 1 }))));
    const { user } = renderRoutes(routes, { route: "/artists" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    fail = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("table", { name: "Artists" })).toBeInTheDocument();
  });

  it("long names wrap instead of widening the page", async () => {
    server.use(artistsHandler([{ ...sampleArtists[0]!, name: "A".repeat(200) }]));
    renderRoutes(routes, { route: "/artists" });
    const name = await screen.findByText("A".repeat(200));
    expect(name).toHaveClass("break-words");
  });

  it("sign-out drops the cached artist pages (they contain emails)", async () => {
    signInForTest();
    server.use(artistsHandler());
    const { user, queryClient, router } = renderRoutes(routes, { route: "/artists" });
    await screen.findByText("booking@example.com");
    expect(queryClient.getQueryCache().findAll({ queryKey: ["artists"] }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    // The admin pages are gone; anything cached now was fetched without a token.
    await waitFor(() =>
      expect(JSON.stringify(queryClient.getQueryCache().findAll({ queryKey: ["artists"] }).map((q) => q.state.data))).not.toContain("@example.com"),
    );

    await router.navigate("/artists");
    await screen.findByRole("table", { name: "Artists" });
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
  });
});
