import type { DistributionAnswer, Genre, TrackStatus } from "@/features/tracks/catalog";
import { apiFetch } from "./client";
import type { components } from "./schema";

export type TrackListItem = components["schemas"]["TrackListItemDto"];
export type TrackDetail = components["schemas"]["TrackDetailDto"];
export type TrackDistribution = components["schemas"]["TrackDistributionDto"];
export type TracksPage = components["schemas"]["PagedResultOfTrackListItemDto"];

export interface TrackListParams {
  page: number;
  pageSize: number;
  status?: TrackStatus;
  genre?: Genre;
  artistId?: string;
}

export interface CreateTrackRequest {
  title: string;
  artistId: string;
  isrc: string;
  genre: Genre;
  /** "YYYY-MM-DD" */
  releaseDate: string;
}

export function listTracks(params: TrackListParams, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.status) query.set("status", params.status);
  if (params.genre) query.set("genre", params.genre);
  if (params.artistId) query.set("artistId", params.artistId);
  return apiFetch<TracksPage>(`/tracks?${query}`, { signal });
}

export function getTrack(id: string, signal?: AbortSignal) {
  return apiFetch<TrackDetail>(`/tracks/${encodeURIComponent(id)}`, { signal });
}

export function createTrack(body: CreateTrackRequest) {
  return apiFetch<TrackDetail>("/tracks", { method: "POST", body });
}

export function changeTrackStatus(id: string, status: TrackStatus) {
  return apiFetch<TrackDetail>(`/tracks/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } });
}

/** Sends the track to the platforms; the answer is the updated track (also when nothing changed). */
export function distributeTrack(id: string, dspIds: string[]) {
  return apiFetch<TrackDetail>(`/tracks/${encodeURIComponent(id)}/distribute`, { method: "POST", body: { dspIds } });
}

/** Records a platform's (simulated) answer for a pending delivery. */
export function recordDistributionAnswer(id: string, dspId: string, status: DistributionAnswer) {
  return apiFetch<TrackDetail>(`/tracks/${encodeURIComponent(id)}/distributions/${encodeURIComponent(dspId)}`, {
    method: "PATCH",
    body: { status },
  });
}
