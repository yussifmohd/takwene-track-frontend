import { X } from "lucide-react";
import { useState } from "react";
import { ArtistPicker } from "@/features/artists/components/ArtistPicker";
import { useArtistQuery } from "@/features/artists/hooks/useArtistLookup";
import { isApiError } from "@/api/problem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GENRES, STATUS_LABEL, STATUSES, isGenre, isTrackStatus } from "../catalog";
import type { TrackFilters as Filters } from "../hooks/useTrackFilters";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Status, genre and artist filters (all in the address). The artist filter shows the artist's name. */
export function TrackFilters({
  filters,
  hasFilters,
  onChange,
  onClear,
}: {
  filters: Filters;
  hasFilters: boolean;
  onChange: <K extends keyof Filters>(key: K, value: Filters[K] | undefined) => void;
  onClear: () => void;
}) {
  // The name of an artist just picked is known at once; one from the address is looked up.
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null);
  const artist = useArtistQuery(picked?.id === filters.artistId ? undefined : filters.artistId);
  const artistName = !filters.artistId
    ? undefined
    : picked?.id === filters.artistId
      ? picked.name
      : (artist.data?.name ?? (isApiError(artist.error) && artist.error.status === 404 ? "Unknown artist" : undefined));

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="filter-status">Status</Label>
        <select
          id="filter-status"
          className={selectClass}
          value={filters.status ?? ""}
          onChange={(event) => onChange("status", isTrackStatus(event.target.value) ? event.target.value : undefined)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="filter-genre">Genre</Label>
        <select
          id="filter-genre"
          className={selectClass}
          value={filters.genre ?? ""}
          onChange={(event) => onChange("genre", isGenre(event.target.value) ? event.target.value : undefined)}
        >
          <option value="">All genres</option>
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="filter-artist">Artist</Label>
        <ArtistPicker
          id="filter-artist"
          value={filters.artistId}
          selectedName={artistName}
          onChange={(next) => {
            setPicked(next);
            onChange("artistId", next?.id);
          }}
          placeholder="All artists"
          clearable
        />
      </div>
      <Button variant="ghost" onClick={onClear} disabled={!hasFilters} className={hasFilters ? undefined : "invisible"}>
        <X aria-hidden />
        Clear filters
      </Button>
    </div>
  );
}
