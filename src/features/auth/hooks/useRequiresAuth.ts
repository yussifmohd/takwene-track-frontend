import { useMatches } from "react-router";
import type { AuthRouteHandle } from "../components/RequireAuth";

/** True when the current page sits under a route with `handle.requiresAuth`. */
export function useRequiresAuth() {
  return useMatches().some((match) => (match.handle as AuthRouteHandle | undefined)?.requiresAuth === true);
}
