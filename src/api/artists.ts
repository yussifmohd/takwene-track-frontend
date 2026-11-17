import { apiFetch } from "./client";
import type { components } from "./schema";

export type Artist = components["schemas"]["ArtistDto"];
export type ArtistsPage = components["schemas"]["PagedResultOfArtistDto"];
export type CreateArtistRequest = components["schemas"]["CreateArtistRequest"];

export function listArtists(params: { page: number; pageSize: number }, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  return apiFetch<ArtistsPage>(`/artists?${query}`, { signal });
}

export function createArtist(body: CreateArtistRequest) {
  return apiFetch<Artist>("/artists", { method: "POST", body });
}

/** Artists whose name contains `search` (ignoring case); an empty search lists the first page by name. */
export function searchArtists(search: string, pageSize: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: "1", pageSize: String(pageSize) });
  if (search.trim()) query.set("search", search.trim());
  return apiFetch<ArtistsPage>(`/artists?${query}`, { signal });
}

export function getArtist(id: string, signal?: AbortSignal) {
  return apiFetch<Artist>(`/artists/${encodeURIComponent(id)}`, { signal });
}
