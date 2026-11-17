import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { endExpiredSession, useAuthStore } from "@/stores/authStore";
import { AUTH_QUERY_KEY } from "../hooks/useLoginMutation";

// setTimeout overflows above ~24.8 days; sessions are 60 minutes, but stay safe.
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Ends the session when the token expires (timer + check on focus), clears signed-in data, and
 * tells the user why they were signed out. Protected pages then redirect via RequireAuth.
 */
export function SessionWatcher() {
  const session = useAuthStore((s) => s.session);
  const signOutReason = useAuthStore((s) => s.signOutReason);
  const acknowledgeSignOut = useAuthStore((s) => s.acknowledgeSignOut);
  const queryClient = useQueryClient();

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
    if (!session) queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
  }, [session, queryClient]);

  useEffect(() => {
    if (signOutReason === "expired") {
      toast.info("Your session ended", { description: "Sign in again to make changes." });
    } else if (signOutReason === "rejected") {
      toast.warning("Your session is no longer valid", { description: "Sign in again to make changes." });
    }
    if (signOutReason) acknowledgeSignOut();
  }, [signOutReason, acknowledgeSignOut]);

  return null;
}
