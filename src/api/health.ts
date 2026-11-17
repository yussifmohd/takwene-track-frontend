import { apiFetch } from "./client";
import type { components } from "./schema";

export type HealthReport = components["schemas"]["HealthReportDto"];
export type HealthCheckEntry = components["schemas"]["HealthCheckEntryDto"];
export type HealthState = components["schemas"]["HealthState"];

/** 503 carries the same report (unhealthy), so it is data, not an error. */
export function getHealth(signal?: AbortSignal) {
  return apiFetch<HealthReport>("/health", { signal, acceptStatuses: [503] });
}
