import type { TrackListParams } from "@/api/tracks";

/** Tracks hold no personal data, so (unlike artists) they stay cached across sign-out. */
export const trackKeys = {
  all: ["tracks"] as const,
  lists: () => [...trackKeys.all, "list"] as const,
  list: (params: TrackListParams) => [...trackKeys.lists(), params] as const,
  details: () => [...trackKeys.all, "detail"] as const,
  detail: (id: string) => [...trackKeys.details(), id] as const,
};
