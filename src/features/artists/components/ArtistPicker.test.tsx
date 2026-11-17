import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { Artist } from "@/api/artists";
import { renderWithProviders } from "@/test/render";
import { artistsHandler, server } from "@/test/server";
import { ArtistPicker } from "./ArtistPicker";

function manyArtists(count: number): Artist[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    name: `Artist ${String(i + 1).padStart(2, "0")}`,
    countryCode: "SA",
    createdAtUtc: "2026-11-17T09:00:00Z",
  }));
}

function Harness() {
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);
  return (
    <>
      <label htmlFor="artist">Artist</label>
      <ArtistPicker id="artist" value={picked?.id} selectedName={picked?.name} onChange={setPicked} clearable />
      <output>{picked ? picked.id : "none"}</output>
    </>
  );
}

describe("ArtistPicker", () => {
  it("lists the first 10 artists when the empty field gets focus", async () => {
    const requests: URL[] = [];
    server.use(artistsHandler(manyArtists(15), { requests }));
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "Artist" }));

    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(10));
    expect(requests.at(-1)!.searchParams.get("pageSize")).toBe("10");
    expect(requests.at(-1)!.searchParams.has("search")).toBe(false);
  });

  it("searches after typing stops and says when nothing matches", async () => {
    const requests: URL[] = [];
    server.use(artistsHandler(undefined, { requests }));
    const { user } = renderWithProviders(<Harness />);

    await user.type(screen.getByRole("combobox"), "عمرو");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.getByRole("option")).toHaveTextContent("عمرو دياب");
    // One request for the empty field, one for the finished term (debounced, not one per key).
    expect(requests.map((url) => url.searchParams.get("search"))).toEqual([null, "عمرو"]);

    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(await screen.findByText("No artists match “zzz”.")).toBeInTheDocument();
  });

  it("works from the keyboard: arrows move, Enter picks, Escape closes", async () => {
    server.use(artistsHandler());
    const { user } = renderWithProviders(<Harness />);
    const input = screen.getByRole("combobox");

    await user.click(input);
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(3));
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", screen.getAllByRole("option")[1]!.id);
    await user.keyboard("{Enter}");

    expect(screen.getByText("a2")).toBeInTheDocument();
    expect(input).toHaveValue("Nancy عجرم");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Clear artist" }));
    expect(screen.getByText("none")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("drops half-typed text that was never picked when the field loses focus", async () => {
    server.use(artistsHandler());
    const { user } = renderWithProviders(<Harness />);
    await user.type(screen.getByRole("combobox"), "Nan");
    await user.tab();
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByText("none")).toBeInTheDocument();
  });
});
