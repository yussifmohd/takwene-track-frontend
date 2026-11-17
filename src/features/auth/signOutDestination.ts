import type { SignOutReason } from "@/stores/authStore";
import { loginPathFor } from "./redirect";

/**
 * Where the app goes after a sign-out, or null to stay on the page.
 * - manual: the sign-in page (a fresh start; signing in again goes to the status page);
 * - expired / rejected: the sign-in page with the current page as return address;
 * - other-tab: only protected pages are left (with return address); public pages stay.
 */
export function signOutDestination(reason: SignOutReason, here: string, onProtectedPage: boolean): string | null {
  if (reason === "manual") return "/login";
  if (reason === "other-tab" && !onProtectedPage) return null;
  return loginPathFor(here);
}

/** The explanation the sign-in page shows after an automatic sign-out. */
export const SIGN_OUT_MESSAGES: Partial<Record<SignOutReason, string>> = {
  expired: "Your session ended. Sign in again to continue.",
  rejected: "Your session is no longer valid. Sign in again to continue.",
  "other-tab": "You signed out in another tab. Sign in again to continue.",
};

/** Navigation state handed to the sign-in page. */
export interface SignOutNavigationState {
  signOutReason: SignOutReason;
}
