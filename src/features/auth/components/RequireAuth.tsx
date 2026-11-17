import { ShieldAlert } from "lucide-react";
import { Link, Navigate, Outlet, useLocation, useMatches } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore, useIsAuthenticated } from "@/stores/authStore";
import { loginPathFor } from "../redirect";

/** Route handle: `requiresAuth` on the guarded layout route; `requiresRole` on a page that needs a role too. */
export interface AuthRouteHandle {
  requiresAuth?: boolean;
  requiresRole?: { role: string; deniedTitle: string; backTo: { path: string; label: string } };
}

/**
 * Layout route: signed-out visitors go to sign-in and come back here afterwards. Right after a
 * sign-out, SessionWatcher owns the redirect; until it lands, show nothing (never stale content).
 * Signed in without a page's required role → a "not allowed" message instead of the page.
 */
export function RequireAuth() {
  const isAuthenticated = useIsAuthenticated();
  const signingOut = useAuthStore((s) => s.signOutReason !== null);
  const roles = useAuthStore((s) => s.session?.roles);
  const location = useLocation();
  const required = useMatches()
    .map((match) => (match.handle as AuthRouteHandle | undefined)?.requiresRole)
    .findLast((role) => role !== undefined);

  if (!isAuthenticated) {
    if (signingOut) return null;
    return <Navigate to={loginPathFor(`${location.pathname}${location.search}`)} replace />;
  }
  if (required && !roles?.includes(required.role)) {
    return (
      <section aria-labelledby="denied-title" className="flex max-w-prose flex-col items-start gap-3">
        <ShieldAlert aria-hidden className="size-6 text-muted-foreground" />
        <h1 id="denied-title" className="text-2xl font-semibold tracking-tight">
          {required.deniedTitle}
        </h1>
        <p className="text-muted-foreground">You are signed in without the {required.role} role.</p>
        <Button asChild variant="outline">
          <Link to={required.backTo.path}>{required.backTo.label}</Link>
        </Button>
      </section>
    );
  }
  return <Outlet />;
}
