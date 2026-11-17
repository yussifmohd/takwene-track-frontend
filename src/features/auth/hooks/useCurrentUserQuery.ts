import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { isApiError } from "@/api/problem";
import { AUTH_QUERY_KEY } from "./useLoginMutation";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: [...AUTH_QUERY_KEY, "me"],
    queryFn: ({ signal }) => getCurrentUser(signal),
    // A 401 ends the session (handled globally); retrying it would only repeat that.
    retry: (failureCount, error) => !(isApiError(error) && error.status === 401) && failureCount < 1,
  });
}
