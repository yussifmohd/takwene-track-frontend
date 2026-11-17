import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const SESSION_STORAGE_KEY = "trackmgmt.session";
const SESSION_VERSION = 1;

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
  email: z.string().min(1),
  roles: z.array(z.string()),
});

export type Session = z.infer<typeof sessionSchema>;

/** Why the last sign-out happened; drives the toast (in memory only). */
export type SignOutReason = "manual" | "expired" | "rejected";

interface AuthState {
  session: Session | null;
  signOutReason: SignOutReason | null;
  signIn: (session: Session) => void;
  signOut: (reason: SignOutReason) => void;
  /** Marks the sign-out reason as shown so the toast appears once. */
  acknowledgeSignOut: () => void;
}

export function isSessionValid(session: Session | null, now = Date.now()): session is Session {
  return session !== null && Date.parse(session.expiresAt) > now;
}

/** Keeps a persisted session only if it parses and has not expired. */
function readPersistedSession(persisted: unknown): Session | null {
  const parsed = z.object({ session: sessionSchema.nullable() }).safeParse(persisted);
  if (!parsed.success) return null;
  return isSessionValid(parsed.data.session) ? parsed.data.session : null;
}

/**
 * The signed-in session. Persisted to localStorage so it survives reloads (accepted trade-off:
 * readable by script on this origin; mitigated by CSP, no HTML injection, 60-minute tokens).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      signOutReason: null,
      signIn: (session) => set({ session, signOutReason: null }),
      signOut: (reason) => {
        set((state) => (state.session ? { session: null, signOutReason: reason } : state));
        useAuthStore.persist.clearStorage();
      },
      acknowledgeSignOut: () => set({ signOutReason: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      version: SESSION_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      // Data from another version is discarded rather than trusted.
      migrate: () => ({ session: null }),
      merge: (persisted, current) => ({ ...current, session: readPersistedSession(persisted) }),
    },
  ),
);

export const useSession = () => useAuthStore((s) => s.session);
export const useIsAuthenticated = () => useAuthStore((s) => isSessionValid(s.session));
export const useIsAdmin = () => useAuthStore((s) => isSessionValid(s.session) && s.session.roles.includes("Admin"));

/** The bearer token to send, or null when signed out or expired. */
export function getValidAccessToken(): string | null {
  const { session } = useAuthStore.getState();
  return isSessionValid(session) ? session.accessToken : null;
}
