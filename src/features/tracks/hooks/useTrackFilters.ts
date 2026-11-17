import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { isGenre, isTrackStatus, type Genre, type TrackStatus } from "../catalog";

export interface TrackFilters {
  status?: TrackStatus;
  genre?: Genre;
  artistId?: string;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTER_KEYS = ["status", "genre", "artistId"] as const;

/**
 * Catalog filters and page in the address (`?status=submitted&genre=R%26B&artistId=…&page=2`).
 * Values the API would refuse are ignored (treated as "no filter"), never rewritten. Changing a filter
 * returns to page 1. Every change is a history entry, so Back undoes it.
 */
export function useTrackFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status");
  const genre = searchParams.get("genre");
  const artistId = searchParams.get("artistId");
  const rawPage = searchParams.get("page");

  const filters = useMemo<TrackFilters>(
    () => ({
      status: isTrackStatus(status) ? status : undefined,
      genre: isGenre(genre) ? genre : undefined,
      artistId: artistId && GUID.test(artistId) ? artistId.toLowerCase() : undefined,
    }),
    [status, genre, artistId],
  );

  const parsedPage = rawPage !== null && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Number.isSafeInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const setFilter = useCallback(
    <K extends keyof TrackFilters>(key: K, value: TrackFilters[K] | undefined) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (value) params.set(key, value);
        else params.delete(key);
        params.delete("page");
        return params;
      }),
    [setSearchParams],
  );

  const clearFilters = useCallback(
    () =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        [...FILTER_KEYS, "page"].forEach((key) => params.delete(key));
        return params;
      }),
    [setSearchParams],
  );

  const setPage = useCallback(
    (next: number) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next <= 1) params.delete("page");
        else params.set("page", String(next));
        return params;
      }),
    [setSearchParams],
  );

  const hasFilters = Boolean(filters.status || filters.genre || filters.artistId);
  return { filters, page, hasFilters, setFilter, clearFilters, setPage };
}
