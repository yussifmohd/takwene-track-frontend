import { useAuthStore, type Session } from "@/stores/authStore";

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    accessToken: "token-abc",
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    email: "admin@takwene.local",
    roles: ["Admin"],
    ...overrides,
  };
}

/** Signs in (in memory and storage) for a test. */
export function signInForTest(overrides: Partial<Session> = {}) {
  const session = makeSession(overrides);
  useAuthStore.getState().signIn(session);
  return session;
}

export function resetAuth() {
  useAuthStore.setState({ session: null, signOutReason: null });
  localStorage.clear();
}
