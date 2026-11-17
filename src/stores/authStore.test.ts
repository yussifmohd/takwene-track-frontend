import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeSession } from "@/test/session";
import { endExpiredSession, getValidAccessToken, isSessionValid, SESSION_STORAGE_KEY, useAuthStore } from "./authStore";

function stored(state: unknown, version = 1) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ state, version }));
}

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ session: null, signOutReason: null });
  });
  afterEach(() => localStorage.clear());

  it("signIn persists the session under trackmgmt.session", () => {
    const session = makeSession();
    useAuthStore.getState().signIn(session);

    const raw = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);
    expect(raw).toEqual({ state: { session }, version: 1 });
    expect(getValidAccessToken()).toBe("token-abc");
  });

  it("does not persist the sign-out reason", () => {
    useAuthStore.getState().signIn(makeSession());
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toContain("signOutReason");
  });

  it("signOut clears storage and records the reason", () => {
    useAuthStore.getState().signIn(makeSession());

    useAuthStore.getState().signOut("expired");

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().signOutReason).toBe("expired");
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("storage stays empty after sign-out even when state changes again", () => {
    useAuthStore.getState().signIn(makeSession());
    useAuthStore.getState().signOut("manual");

    useAuthStore.getState().acknowledgeSignOut();

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("drops unreadable stored JSON and removes it from storage", async () => {
    localStorage.setItem(SESSION_STORAGE_KEY, "{not json");
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("sign-out leaves nothing of the session in storage", () => {
    useAuthStore.getState().signIn(makeSession());
    localStorage.setItem("unrelated", "kept");

    useAuthStore.getState().signOut("manual");
    useAuthStore.getState().acknowledgeSignOut();

    expect(Object.keys(localStorage)).toEqual(["unrelated"]);
    expect(JSON.stringify(localStorage)).not.toContain("token-abc");
  });

  it("signOut while already signed out keeps the earlier reason", () => {
    useAuthStore.getState().signIn(makeSession());
    useAuthStore.getState().signOut("rejected");
    useAuthStore.getState().signOut("manual");

    expect(useAuthStore.getState().signOutReason).toBe("rejected");
  });

  it("rehydrates a valid stored session", async () => {
    const session = makeSession();
    stored({ session });

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().session).toEqual(session);
  });

  it.each([
    ["expired", { session: makeSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }) }, 1],
    ["malformed", { session: { accessToken: 42, email: "x" } }, 1],
    ["bad date", { session: makeSession({ expiresAt: "tomorrow" }) }, 1],
    ["wrong version", { session: makeSession() }, 0],
  ])("drops a %s stored session", async (_label, state, version) => {
    stored(state, version);

    await useAuthStore.persist.rehydrate();

    // Memory and storage agree: the rejected entry is gone, not just ignored (regression).
    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("isSessionValid is false at and after expiry", () => {
    const expiresAt = "2026-11-17T12:00:00Z";
    const session = makeSession({ expiresAt });
    expect(isSessionValid(session, Date.parse(expiresAt) - 1)).toBe(true);
    expect(isSessionValid(session, Date.parse(expiresAt))).toBe(false);
    expect(isSessionValid(null)).toBe(false);
  });

  it("getValidAccessToken ends an expired in-memory session and returns null", () => {
    useAuthStore.getState().signIn(makeSession({ expiresAt: new Date(Date.now() - 1).toISOString() }));
    expect(getValidAccessToken()).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("endExpiredSession only acts on an expired session", () => {
    const session = makeSession();
    useAuthStore.getState().signIn(session);
    expect(endExpiredSession(Date.parse(session.expiresAt) - 1)).toBe(false);
    expect(useAuthStore.getState().session).toEqual(session);

    expect(endExpiredSession(Date.parse(session.expiresAt))).toBe(true);
    expect(useAuthStore.getState().signOutReason).toBe("expired");
    expect(endExpiredSession()).toBe(false);
  });
});
