import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listArtists } from "@/api/artists";
import { artistKeys } from "../queryKeys";

export const ARTISTS_PAGE_SIZE = 20;

/** One page of artists; keeps the previous page on screen while the next one loads. */
export function useArtistsQuery(page: number) {
  const params = { page, pageSize: ARTISTS_PAGE_SIZE };
  return useQuery({
    queryKey: artistKeys.list(params),
    queryFn: ({ signal }) => listArtists(params, signal),
    placeholderData: keepPreviousData,
  });
}
