import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeTrackStatus, createTrack, getTrack, listTracks, type CreateTrackRequest } from "@/api/tracks";
import type { TrackStatus } from "../catalog";
import { trackKeys } from "../queryKeys";
import type { TrackFilters } from "./useTrackFilters";

export const TRACKS_PAGE_SIZE = 20;

/** One catalog page; the previous page stays on screen while the next loads. */
export function useTracksQuery(filters: TrackFilters, page: number) {
  const params = { ...filters, page, pageSize: TRACKS_PAGE_SIZE };
  return useQuery({
    queryKey: trackKeys.list(params),
    queryFn: ({ signal }) => listTracks(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useTrackQuery(id: string) {
  return useQuery({ queryKey: trackKeys.detail(id), queryFn: ({ signal }) => getTrack(id, signal) });
}

/** Creates a track; seeds its detail (the next page shows it at once) and refreshes every list. */
export function useCreateTrackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTrackRequest) => createTrack(body),
    onSuccess: (track) => {
      queryClient.setQueryData(trackKeys.detail(track.id), track);
      return queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
    },
  });
}

/** Changes a track's status; the response is the updated track, so the detail needs no refetch. */
export function useChangeTrackStatusMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TrackStatus) => changeTrackStatus(id, status),
    onSuccess: (track) => {
      queryClient.setQueryData(trackKeys.detail(id), track);
      return queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
    },
  });
}
