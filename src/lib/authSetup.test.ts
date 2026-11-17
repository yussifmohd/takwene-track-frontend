import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiFetch, configureApiClient } from "@/api/client";
import { SESSION_STORAGE_KEY, useAuthStore } from "@/stores/authStore";
import { server } from "@/test/server";
import { makeSession, signInForTest } from "@/test/session";
import { setupAuth } from "./authSetup";

describe("setupAuth", () => {
  let cleanup: () => void;
  let authorization: string | null;

  beforeEach(() => {
    cleanup = setupAuth(window);
    authorization = null;
    server.use(
      http.get("*/api/echo", ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({});
      }),
    );
  });
  afterEach(() => {
    cleanup();
    configureApiClient({ getAccessToken: () => null, onUnauthorized: () => {} });
  });

  it("attaches the token of a valid session", async () => {
    signInForTest({ accessToken: "valid-token" });
    await apiFetch("/echo");
    expect(authorization).toBe("Bearer valid-token");
  });

  it("does not attach the token of an expired session", async () => {
    useAuthStore.setState({ session: makeSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }) });
    await apiFetch("/echo");
    expect(authorization).toBeNull();
  });

  it("signs out with reason 'rejected' when an authenticated call gets 401", async () => {
    signInForTest();
    server.use(http.get("*/api/auth/me", () => HttpResponse.json({ status: 401 }, { status: 401 })));

    await apiFetch("/auth/me").catch(() => undefined);

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().signOutReason).toBe("rejected");
  });

  it("follows a sign-out in another tab", () => {
    signInForTest();
    localStorage.removeItem(SESSION_STORAGE_KEY); // what the other tab did

    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: null }));

    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("follows another tab clearing all storage (key null)", () => {
    signInForTest();
    localStorage.clear();

    window.dispatchEvent(new StorageEvent("storage", { key: null, newValue: null }));

    expect(useAuthStore.getState().session).toBeNull();
  });

  it("trusts storage, not the event payload: a removal event while the entry is still there keeps the session", () => {
    signInForTest();
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: null }));
    expect(useAuthStore.getState().session).not.toBeNull();
  });

  it("removes an expired session written by another tab instead of adopting it", async () => {
    const value = JSON.stringify({
      state: { session: makeSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }) },
      version: 1,
    });
    localStorage.setItem(SESSION_STORAGE_KEY, value);

    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: value }));

    await expect.poll(() => localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("ends an expired in-memory session instead of sending its token", async () => {
    useAuthStore.setState({ session: makeSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }) });
    await apiFetch("/echo");
    expect(authorization).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().signOutReason).toBe("expired");
  });

  it("follows a sign-in in another tab", async () => {
    const session = makeSession({ email: "other-tab@takwene.local" });
    const value = JSON.stringify({ state: { session }, version: 1 });
    localStorage.setItem(SESSION_STORAGE_KEY, value);

    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: value }));

    await expect.poll(() => useAuthStore.getState().session?.email).toBe("other-tab@takwene.local");
  });

  it("ignores other storage keys", () => {
    signInForTest();
    window.dispatchEvent(new StorageEvent("storage", { key: "something-else", newValue: null }));
    expect(useAuthStore.getState().session).not.toBeNull();
  });
});
