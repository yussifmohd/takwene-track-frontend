import { z } from "zod";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

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

type PersistedAuth = { session: Session | null };

/**
 * localStorage with one rule: no session → no key. Any later state write (e.g. clearing the
 * sign-out reason) can then never leave a stale entry behind, and other tabs see a removal.
 */
const sessionStorageAdapter: PersistStorage<PersistedAuth> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<PersistedAuth>;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (value.state.session) localStorage.setItem(name, JSON.stringify(value));
    else localStorage.removeItem(name);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

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
  persist<AuthState, [], [], PersistedAuth>(
    (set) => ({
      session: null,
      signOutReason: null,
      signIn: (session) => set({ session, signOutReason: null }),
      signOut: (reason) => set((state) => (state.session ? { session: null, signOutReason: reason } : state)),
      acknowledgeSignOut: () => set({ signOutReason: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      version: SESSION_VERSION,
      storage: sessionStorageAdapter,
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
