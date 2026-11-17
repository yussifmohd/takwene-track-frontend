import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDsps } from "@/api/dsps";
import {
  changeTrackStatus,
  createTrack,
  distributeTrack,
  getTrack,
  listTracks,
  recordDistributionAnswer,
  type CreateTrackRequest,
  type TrackDetail,
} from "@/api/tracks";
import type { DistributionAnswer, TrackStatus } from "../catalog";
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

/** Every track change answers with the updated track: store it as the detail and refresh the lists. */
function useTrackChangeMutation<TVariables>(id: string, mutationFn: (variables: TVariables) => Promise<TrackDetail>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (track) => {
      queryClient.setQueryData(trackKeys.detail(id), track);
      return queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
    },
  });
}

/** Changes a track's status (submit or withdraw). */
export function useChangeTrackStatusMutation(id: string) {
  return useTrackChangeMutation(id, (status: TrackStatus) => changeTrackStatus(id, status));
}

/** Sends a track to platforms. */
export function useDistributeTrackMutation(id: string) {
  return useTrackChangeMutation(id, (dspIds: string[]) => distributeTrack(id, dspIds));
}

/** Records a platform's simulated answer for one pending delivery. */
export function useRecordAnswerMutation(id: string) {
  return useTrackChangeMutation(id, ({ dspId, status }: { dspId: string; status: DistributionAnswer }) =>
    recordDistributionAnswer(id, dspId, status),
  );
}

/** The platforms; they change only with a deployment, so they are fetched once. */
export function useDspsQuery(enabled = true) {
  return useQuery({ queryKey: ["dsps"], queryFn: ({ signal }) => listDsps(signal), staleTime: Infinity, enabled });
}
