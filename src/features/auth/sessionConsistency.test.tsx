import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { SESSION_STORAGE_KEY, useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, currentUser, server } from "@/test/server";
import { makeSession, signInForTest } from "@/test/session";

/*
 * Regression suite for the Phase 1 sign-out/reload bug: storage and memory must always agree, and
 * every place that shows auth state must show the same state – before and after a reload.
 */

/** What a reload does: the page goes away, the store is rebuilt from localStorage, the app mounts again. */
async function reload(current: { unmount: () => void }, route: string) {
  current.unmount();
  // Memory is gone; storage is what the page left behind. (Resetting memory goes through persist
  // and would write storage, which a real reload never does – so put storage back afterwards.)
  const leftBehind = Object.entries(localStorage);
  useAuthStore.setState({ session: null, signOutReason: null });
  localStorage.clear();
  for (const [key, value] of leftBehind) localStorage.setItem(key, value);
  await useAuthStore.persist.rehydrate(); // read back through the same code path as page load
  return renderRoutes(routes, { route });
}

/** The header never shows "Sign in" together with the signed-in controls, nor neither of them. */
function expectHeader(state: "signed-in" | "signed-out", { onLoginPage = false } = {}) {
  const banner = screen.getByRole("banner");
  const signIn = within(banner).queryByRole("link", { name: "Sign in" });
  const signOut = within(banner).queryByRole("button", { name: "Sign out" });
  const account = within(banner).queryByRole("link", { name: "My account" });
  const email = within(banner).queryByText(ADMIN_EMAIL);
  if (state === "signed-in") {
    expect(signIn).toBeNull();
    expect(signOut).not.toBeNull();
    expect(account).not.toBeNull();
    expect(email).not.toBeNull();
  } else {
    expect(signOut).toBeNull();
    expect(account).toBeNull();
    expect(email).toBeNull();
    if (onLoginPage) expect(signIn).toBeNull(); // the page itself is the sign-in form
    else expect(signIn).not.toBeNull();
  }
}

function useMeEndpoint() {
  server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
}

describe("session consistency across sign-out and reload", () => {
  it("sign-out on the account page clears storage completely and every place stays signed out after reload", async () => {
    useMeEndpoint();
    signInForTest();
    let app = renderRoutes(routes, { route: "/account" });
    await screen.findByRole("heading", { name: "Your account" });
    expectHeader("signed-in");

    await app.user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/login"));
    expectHeader("signed-out", { onLoginPage: true });
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(Object.keys(localStorage)).toEqual([]);

    // Reload on the status page.
    app = await reload(app, "/");
    expect(useAuthStore.getState().session).toBeNull();
    expectHeader("signed-out");

    // Protected page → sign-in.
    app = await reload(app, "/account");
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/login"));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expectHeader("signed-out", { onLoginPage: true });

    // Login page shows the form (it does not bounce a "signed-in" visitor away).
    app = await reload(app, "/login");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe("/login");
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("reload while signed in stays signed in everywhere", async () => {
    useMeEndpoint();
    const session = signInForTest();
    let app = renderRoutes(routes, { route: "/" });

    app = await reload(app, "/");
    expect(useAuthStore.getState().session).toEqual(session);
    expectHeader("signed-in");

    app = await reload(app, "/account");
    expect(await screen.findByRole("heading", { name: "Your account" })).toBeInTheDocument();
    expectHeader("signed-in");

    app = await reload(app, "/login");
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/"));
    expectHeader("signed-in");
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!).state.session).toEqual(session);
  });

  it("reload with an expired stored session is signed out everywhere and removes the entry", async () => {
    signInForTest({ expiresAt: new Date(Date.now() + 60 * 60_000).toISOString() });
    // The token expired while the browser was closed.
    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!);
    stored.state.session.expiresAt = new Date(Date.now() - 60_000).toISOString();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
    let app = renderRoutes(routes, { route: "/" });

    app = await reload(app, "/");

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expectHeader("signed-out");
    app = await reload(app, "/account");
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/login"));
  });

  it("when the session expires on an open page, the header flips as a whole and storage is cleared", async () => {
    signInForTest({ expiresAt: new Date(Date.now() + 1500).toISOString() });
    const { router } = renderRoutes(routes, { route: "/" });
    expectHeader("signed-in");

    await waitFor(() => expect(useAuthStore.getState().session).toBeNull(), { timeout: 4000 });

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    await waitFor(() => expectHeader("signed-out", { onLoginPage: true }));
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("an expired session never counts as signed in, even before the watcher runs", () => {
    useAuthStore.setState({ session: makeSession({ expiresAt: new Date(Date.now() - 1).toISOString() }) });
    renderRoutes(routes, { route: "/" });
    // The watcher ends it on mount; header and store agree immediately.
    expect(useAuthStore.getState().session).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });
});
