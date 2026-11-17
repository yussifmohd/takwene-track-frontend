import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { TrackListItem } from "@/api/tracks";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { ARTIST_ID, problem, sampleArtists, sampleTracks, server, tracksHandler } from "@/test/server";
import { signInForTest } from "@/test/session";

const table = () => screen.getByRole("table", { name: "Tracks" });
const titles = () => within(table()).getAllByRole("rowheader").map((cell) => cell.textContent);

function manyTracks(count: number): TrackListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleTracks[0]!,
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    title: `Track ${String(i + 1).padStart(2, "0")}`,
  }));
}

describe("TracksPage", () => {
  it("shows a placeholder, then title, artist, genre, status and release date for everyone", async () => {
    renderRoutes(routes, { route: "/" });

    expect(screen.getByRole("status")).toHaveTextContent("Loading tracks");
    await screen.findByRole("table", { name: "Tracks" });

    expect(titles()).toEqual(["Tamally Maak", "سهران", "Mahragan El Nour"]);
    const first = within(table()).getAllByRole("row")[1]!;
    expect(within(first).getByRole("link", { name: "Tamally Maak" })).toHaveAttribute("href", `/tracks/${sampleTracks[0]!.id}`);
    expect(within(first).getByText("Amr Diab")).toHaveAttribute("dir", "auto");
    expect(within(first).getByText("Arabic Pop")).toBeInTheDocument();
    expect(within(first).getByText("Submitted")).toBeInTheDocument();
    expect(within(first).getByText("1 Dec 2026")).toHaveAttribute("datetime", "2026-12-01");
    expect(within(table()).getByText("سهران")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("3 tracks in the catalogue.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add track" })).not.toBeInTheDocument();
  });

  it("offers Add track to a signed-in admin", async () => {
    signInForTest();
    renderRoutes(routes, { route: "/" });
    expect(await screen.findByRole("link", { name: "Add track" })).toHaveAttribute("href", "/tracks/new");
  });

  it("reads filters from the address, sends them to the API, and ignores values the API would refuse", async () => {
    const requests: URL[] = [];
    server.use(tracksHandler(sampleTracks, { requests }), http.get("*/api/artists/:id", () => HttpResponse.json(sampleArtists[0])));
    renderRoutes(routes, { route: `/?status=draft&genre=Khaleeji&artistId=${ARTIST_ID}&page=1` });

    await screen.findByRole("table", { name: "Tracks" });
    expect(titles()).toEqual(["سهران"]);
    const sent = requests.at(-1)!.searchParams;
    expect(sent.get("status")).toBe("draft");
    expect(sent.get("genre")).toBe("Khaleeji");
    expect(sent.get("artistId")).toBe(ARTIST_ID);
    expect(screen.getByLabelText("Status")).toHaveValue("draft");
    expect(screen.getByLabelText("Genre")).toHaveValue("Khaleeji");
    expect(await screen.findByDisplayValue("Amr Diab")).toBeInTheDocument();
    expect(screen.getByText("1 track match these filters.")).toBeInTheDocument();

    requests.length = 0;
    renderRoutes(routes, { route: "/?status=live&genre=Jazz&artistId=not-a-guid&page=-3" });
    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    const ignored = requests.at(-1)!.searchParams;
    expect([...ignored.keys()].sort()).toEqual(["page", "pageSize"]);
    expect(ignored.get("page")).toBe("1");
  });

  it("puts a filter change in the address, drops the page, and Back undoes it", async () => {
    server.use(tracksHandler(manyTracks(25)));
    const { user, router } = renderRoutes(routes, { route: "/?page=2" });
    await screen.findByRole("table", { name: "Tracks" });

    await user.selectOptions(screen.getByLabelText("Status"), "submitted");
    await waitFor(() => expect(router.state.location.search).toBe("?status=submitted"));

    await user.selectOptions(screen.getByLabelText("Genre"), "R&B");
    expect(new URLSearchParams(router.state.location.search).get("genre")).toBe("R&B");
    expect(await screen.findByText("No tracks match these filters")).toBeInTheDocument();

    await router.navigate(-1);
    await waitFor(() => expect(router.state.location.search).toBe("?status=submitted"));
    await waitFor(() => expect(screen.getByLabelText("Genre")).toHaveValue(""));

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("explains an empty filtered result and clears it", async () => {
    const { user, router } = renderRoutes(routes, { route: "/?genre=Rock" });
    expect(await screen.findByText("No tracks match these filters")).toBeInTheDocument();
    await user.click(within(screen.getByText("No tracks match these filters").parentElement!).getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(await screen.findByRole("table", { name: "Tracks" })).toBeInTheDocument();
  });

  it("shows an empty catalogue differently to visitors and admins", async () => {
    server.use(tracksHandler([]));
    renderRoutes(routes, { route: "/" });
    expect(await screen.findByText("No tracks yet")).toBeInTheDocument();
    expect(screen.getByText("Tracks appear here once an admin adds them.")).toBeInTheDocument();
  });

  it("pages through the address and offers a way back from a page past the end", async () => {
    server.use(tracksHandler(manyTracks(25)));
    const { user, router } = renderRoutes(routes, { route: "/" });
    await screen.findByRole("table", { name: "Tracks" });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/ }));
    await waitFor(() => expect(router.state.location.search).toBe("?page=2"));
    await waitFor(() => expect(titles()).toEqual(["Track 21", "Track 22", "Track 23", "Track 24", "Track 25"]));

    await router.navigate("/?page=9");
    expect(await screen.findByText("This page is empty")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go to page 1" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("shows an error with Retry that loads the catalogue once the API answers", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/tracks", () =>
        calls++ === 0
          ? problem(500, { title: "Server error" })
          : HttpResponse.json({ items: sampleTracks, page: 1, pageSize: 20, totalCount: 3, totalPages: 1 }),
      ),
    );
    const { user } = renderRoutes(routes, { route: "/" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("table", { name: "Tracks" })).toBeInTheDocument();
  });
});
