import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore, useIsAuthenticated } from "@/stores/authStore";
import { loginPathFor } from "../redirect";

/** Route handle marking pages that need a signed-in user. */
export interface AuthRouteHandle {
  requiresAuth?: boolean;
}

/**
 * Layout route: signed-out visitors go to sign-in and come back here afterwards. Right after a
 * sign-out, SessionWatcher owns the redirect; until it lands, show nothing (never stale content).
 */
export function RequireAuth() {
  const isAuthenticated = useIsAuthenticated();
  const signingOut = useAuthStore((s) => s.signOutReason !== null);
  const location = useLocation();
  if (!isAuthenticated) {
    if (signingOut) return null;
    return <Navigate to={loginPathFor(`${location.pathname}${location.search}`)} replace />;
  }
  return <Outlet />;
}
