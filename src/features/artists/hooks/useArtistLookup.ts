import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getArtist, searchArtists } from "@/api/artists";
import { artistKeys } from "../queryKeys";

export const ARTIST_SEARCH_LIMIT = 10;
export const ARTIST_SEARCH_DEBOUNCE_MS = 250;

/** `value`, but only after it stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Up to 10 artists whose name contains the (debounced) term; an empty term lists the first 10 by name. */
export function useArtistSearch(term: string, enabled: boolean) {
  const debounced = useDebouncedValue(term.trim(), ARTIST_SEARCH_DEBOUNCE_MS);
  return useQuery({
    queryKey: artistKeys.search(debounced),
    queryFn: ({ signal }) => searchArtists(debounced, ARTIST_SEARCH_LIMIT, signal),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** One artist by id (e.g. the artist filter from the address). */
export function useArtistQuery(id: string | undefined) {
  return useQuery({
    queryKey: artistKeys.detail(id ?? ""),
    queryFn: ({ signal }) => getArtist(id!, signal),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
