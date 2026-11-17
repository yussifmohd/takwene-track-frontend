import { apiFetch } from "./client";
import type { components } from "./schema";

export type Dsp = components["schemas"]["DspDto"];

/** The distribution platforms, ordered by name. */
export function listDsps(signal?: AbortSignal) {
  return apiFetch<Dsp[]>("/dsps", { signal });
}
