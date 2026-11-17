import type { components } from "@/api/schema";

export type TrackStatus = components["schemas"]["TrackStatus"];
export type Genre = components["schemas"]["TrackListItemDto"]["genre"];

/** The API's genre list, in its order (typed against the contract: a renamed genre fails typecheck). */
export const GENRES = ["Arabic Pop", "Mahraganat", "Khaleeji", "Hip-Hop", "Electronic", "Rap", "R&B", "Rock"] as const satisfies readonly Genre[];

/** Workflow order: the badge shows how far along a track is. */
export const STATUSES = ["draft", "submitted", "distributed"] as const satisfies readonly TrackStatus[];

export const STATUS_LABEL: Record<TrackStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  distributed: "Distributed",
};

/** Button text for moving a track to a status (the API lists which moves are allowed). */
export const STATUS_ACTION: Record<TrackStatus, string> = {
  submitted: "Submit",
  draft: "Withdraw to draft",
  distributed: "Mark as distributed",
};

/** Toast text after the move (same verb as the button). */
export const STATUS_DONE: Record<TrackStatus, string> = {
  submitted: "Track submitted",
  draft: "Track withdrawn to draft",
  distributed: "Track marked as distributed",
};

export const isGenre = (value: string | null | undefined): value is Genre => (GENRES as readonly string[]).includes(value ?? "");
export const isTrackStatus = (value: string | null | undefined): value is TrackStatus =>
  (STATUSES as readonly string[]).includes(value ?? "");

// Every contract value has a label (fails typecheck if the contract gains a genre or status).
type Missing<All, Listed> = Exclude<All, Listed>;
const _allGenres: Missing<Genre, (typeof GENRES)[number]> extends never ? true : never = true;
const _allStatuses: Missing<TrackStatus, (typeof STATUSES)[number]> extends never ? true : never = true;
void _allGenres;
void _allStatuses;
