import { queryOptions, useQuery } from "@tanstack/react-query";
import { getHealth } from "@/api/health";

export const HEALTH_REFRESH_MS = 30_000;

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: ["health"] as const,
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: HEALTH_REFRESH_MS,
    refetchIntervalInBackground: false,
    retry: 1,
  });

export function useHealthQuery() {
  return useQuery(healthQueryOptions());
}
