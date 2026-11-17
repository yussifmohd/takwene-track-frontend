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
