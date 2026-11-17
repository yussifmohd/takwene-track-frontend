import { Navigate, Outlet, useLocation } from "react-router";
import { useIsAuthenticated } from "@/stores/authStore";
import { loginPathFor } from "../redirect";

/** Route handle marking pages that need a signed-in user. */
export interface AuthRouteHandle {
  requiresAuth?: boolean;
}

/** Layout route: signed-out visitors go to sign-in and come back here afterwards. */
export function RequireAuth() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={loginPathFor(`${location.pathname}${location.search}`)} replace />;
  return <Outlet />;
}
