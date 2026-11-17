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

const storedValueSchema = z.object({ state: z.object({ session: sessionSchema }), version: z.literal(SESSION_VERSION) });

/** The stored session if it parses, has this version and has not expired; otherwise null. */
function parseStoredSession(raw: string, now = Date.now()): Session | null {
  try {
    const parsed = storedValueSchema.safeParse(JSON.parse(raw));
    return parsed.success && isSessionValid(parsed.data.state.session, now) ? parsed.data.state.session : null;
  } catch {
    return null;
  }
}

/**
 * localStorage that always agrees with memory:
 * - writing: no session → no key, so a later state change can never leave a stale entry behind;
 * - reading: an entry that is unreadable, from another version or expired is removed at the moment
 *   it is rejected. (Before, it was only ignored in memory and stayed in storage, so storage said
 *   "signed in" while the app said "signed out".)
 */
const sessionStorageAdapter: PersistStorage<PersistedAuth> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (raw === null) return null;
    const session = parseStoredSession(raw);
    if (!session) {
      localStorage.removeItem(name);
      return null;
    }
    return { state: { session }, version: SESSION_VERSION } satisfies StorageValue<PersistedAuth>;
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
      // getItem only returns validated sessions of this version; anything else never gets here.
      migrate: () => ({ session: null }),
      merge: (persisted, current) => ({ ...current, session: (persisted as PersistedAuth | undefined)?.session ?? null }),
    },
  ),
);

/*
 * "Signed in" means exactly "the store holds a session". Selectors never look at the clock: a
 * selector only re-runs when the store changes, so a time-based answer differs between components
 * that rendered at different moments. Expiry is turned into a store change instead
 * (endExpiredSession), by the SessionWatcher timer, on focus/visibility and before every API call.
 */
export const useSession = () => useAuthStore((s) => s.session);
export const useIsAuthenticated = () => useAuthStore((s) => s.session !== null);
export const useIsAdmin = () => useAuthStore((s) => s.session?.roles.includes("Admin") ?? false);

/** Signs out with reason "expired" if the held session has expired. Returns true if it did. */
export function endExpiredSession(now = Date.now()): boolean {
  const { session, signOut } = useAuthStore.getState();
  if (session === null || isSessionValid(session, now)) return false;
  signOut("expired");
  return true;
}

/** The bearer token to send, or null when signed out. An expired session is ended, never sent. */
export function getValidAccessToken(): string | null {
  endExpiredSession();
  return useAuthStore.getState().session?.accessToken ?? null;
}
