import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { artistKeys } from "@/features/artists/queryKeys";
import { endExpiredSession, useAuthStore } from "@/stores/authStore";
import { AUTH_QUERY_KEY } from "../hooks/useLoginMutation";
import { useRequiresAuth } from "../hooks/useRequiresAuth";
import { signOutDestination, type SignOutNavigationState } from "../signOutDestination";

// setTimeout overflows above ~24.8 days; sessions are 60 minutes, but stay safe.
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * The one place that finishes every sign-out (manual, expired, rejected by the API, another tab):
 * `signOut(reason)` has already cleared the session and its storage entry; this removes the
 * signed-in query cache, redirects (see signOutDestination) and explains. Also ends the session
 * when the token expires (timer + check on focus/visibility).
 */
export function SessionWatcher() {
  const session = useAuthStore((s) => s.session);
  const signOutReason = useAuthStore((s) => s.signOutReason);
  const acknowledgeSignOut = useAuthStore((s) => s.acknowledgeSignOut);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const onProtectedPage = useRequiresAuth();
  // The location the sign-out happened on, while its redirect is in flight.
  const pendingFrom = useRef<string | null>(null);

  useEffect(() => {
    if (!session) return;
    if (endExpiredSession()) return;
    // Fires at expiry (+ a small margin so the clock has certainly passed it).
    const delay = Date.parse(session.expiresAt) - Date.now() + 50;
    const timer = window.setTimeout(() => void endExpiredSession(), Math.min(delay, MAX_TIMEOUT_MS));

    // Timers are throttled in background tabs and paused during sleep: re-check on return.
    const check = () => void endExpiredSession();
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session]);

  useEffect(() => {
    if (!signOutReason || pendingFrom.current !== null) return;
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    // Artist pages fetched while signed in contain emails (admin-only data).
    queryClient.removeQueries({ queryKey: artistKeys.all });

    const destination = signOutDestination(signOutReason, `${location.pathname}${location.search}`, onProtectedPage);
    if (signOutReason === "manual") toast.success("Signed out");
    if (destination === null) {
      if (signOutReason === "other-tab") toast.info("You signed out in another tab");
      acknowledgeSignOut();
      return;
    }
    // Acknowledged once the new page is shown (next effect). Until then RequireAuth renders
    // nothing, so it cannot start a competing redirect of its own.
    pendingFrom.current = location.key;
    const state: SignOutNavigationState = { signOutReason };
    void navigate(destination, { replace: true, state });
  }, [signOutReason, location, onProtectedPage, navigate, queryClient, acknowledgeSignOut]);

  useEffect(() => {
    if (pendingFrom.current !== null && location.key !== pendingFrom.current) {
      pendingFrom.current = null;
      acknowledgeSignOut();
    }
  }, [location.key, acknowledgeSignOut]);

  return null;
}
