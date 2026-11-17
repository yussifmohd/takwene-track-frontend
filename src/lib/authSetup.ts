import { configureApiClient } from "@/api/client";
import { getValidAccessToken, SESSION_STORAGE_KEY, useAuthStore } from "@/stores/authStore";

/**
 * Connects the API client to the session: attach the token while it is valid, and treat any
 * 401 on an authenticated call as "session no longer valid". Also follows other tabs: signing
 * in or out in one tab updates the others. Returns a cleanup function.
 */
export function setupAuth(target: Window = window) {
  configureApiClient({
    getAccessToken: getValidAccessToken,
    onUnauthorized: () => {
      if (useAuthStore.getState().session) useAuthStore.getState().signOut("rejected");
    },
  });

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SESSION_STORAGE_KEY) return;
    if (event.newValue === null) {
      // Another tab signed out: drop ours without touching storage again.
      if (useAuthStore.getState().session) useAuthStore.setState({ session: null, signOutReason: "manual" });
    } else {
      void useAuthStore.persist.rehydrate();
    }
  };
  target.addEventListener("storage", onStorage);
  return () => target.removeEventListener("storage", onStorage);
}
