# Implementation Plan: Admin Sign-in & Session (Web app)

**Branch**: `002-jwt-authentication-and-authorization` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Backend contract**: `../backend/specs/002-jwt-authentication-and-authorization/contracts/openapi.json`
(exported during backend implementation; intent in `../backend/specs/002-…/contracts/auth-api.md`)

**Skills applied**: react-frontend-stack, frontend-design, git-workflow, decisions-log

## Summary

Add a persisted zustand session store (token, expiry, email, roles) wired into `apiFetch`
(bearer header, 401 → sign out), a `/login` page (react-hook-form + zod, generic credential error,
429 wait message with `Retry-After`, server-unreachable state), a `RequireAuth` route guard with a
safe return address, a protected `/account` page backed by `GET /api/auth/me`, header sign-in /
sign-out, and automatic sign-out at token expiry (and across tabs). CI actions move to Node 24 majors.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.3.1, Node 26.13.1

**Primary Dependencies**: already installed in Phase 0: zustand 5.0.16 (`persist`), react-hook-form
7.91.0, zod 4.6.7, @hookform/resolvers 7.0.1; shadcn `input`, `label` components added via
`shadcn add` (no new npm packages expected; package.json reviewed after the command).

**Storage**: `localStorage` key `trackmgmt.session` (versioned, validated with zod on load)

**Testing**: Vitest + RTL + user-event + MSW; fake timers for expiry

**Target Platform**: evergreen browsers; nginx container / Vite dev

**Project Type**: web-app (SPA)

**Performance Goals**: initial JS stays < 250 kB gzip (CI budget)

**Constraints**: same-origin `/api`; no secrets; no raw HTML; 360 px; keyboard operable

**Scale/Scope**: 2 new routes (`/login`, `/account`), 1 store, 1 guard

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Contract-first | regenerate `schema.d.ts` from backend 002 contract; `LoginResponse`, `CurrentUserDto` from it | ✅ |
| II. State ownership | session (client state) in zustand; `/me` in TanStack Query; return address in URL | ✅ |
| III. Every state designed | submitting, field errors, invalid credentials, throttled, unreachable, signed-in/out, expired; account skeleton/error | ✅ |
| IV. Tests ship with features | store, redirect helper, login page, guard, expiry, 401 handling, account page, header | ✅ |
| V. Security-aware client | token only in store; safe redirects; cleared on sign-out; CSP unchanged; XSS trade-off documented | ✅ |
| VI. Spec-driven | ✅ |
| VII. Simplicity & licenses | no new runtime deps | ✅ |

## Project Structure

```text
src/
├── api/ auth.ts (login, getCurrentUser), client.ts (ApiError.retryAfterSeconds), schema.d.ts (regenerated)
├── stores/ authStore.ts (+ authStore.test.ts)
├── features/auth/
│   ├── schemas.ts (zod login schema mirroring API rules)
│   ├── redirect.ts (getSafeRedirect) (+ test)
│   ├── hooks/ useLoginMutation.ts, useCurrentUserQuery.ts, useSessionExpiry.ts
│   ├── components/ RequireAuth.tsx, AuthMenu.tsx, SessionWatcher.tsx (+ tests)
│   └── pages/ LoginPage.tsx, AccountPage.tsx (+ tests)
├── lib/ authSetup.ts (configureApiClient ↔ store, cross-tab sync)
├── components/ AppShell.tsx (AuthMenu + "My account" nav item when signed in), ui/input.tsx, ui/label.tsx
└── router.tsx (/login outside guard, /account inside RequireAuth)
.github/workflows/frontend-ci.yml (checkout@v7, setup-node@v7)
package.json gen:api → 002 contract
```

## Key design decisions (details in research.md)

1. **Store**: `useAuthStore` (zustand `persist`, `name: "trackmgmt.session"`, `version: 1`,
   `partialize` → `session`). `merge`/`onRehydrateStorage` validates with zod and drops expired or
   malformed sessions. Actions: `signIn(session)`, `signOut(reason: "manual" | "expired" | "rejected")`;
   `signOutReason` kept in memory (not persisted) for messaging.
2. **Client wiring** (`lib/authSetup.ts`, called once in `main.tsx`): `configureApiClient({
   getAccessToken: () => valid session token, onUnauthorized: () => signOut("rejected") })`.
   `onUnauthorized` is skipped for the login request itself (401 there means wrong credentials).
   `window` `storage` event → `useAuthStore.persist.rehydrate()` for cross-tab sign-out.
3. **ApiError** gains `retryAfterSeconds` parsed from `Retry-After` (seconds) for the 429 message.
4. **Login page**: react-hook-form + `zodResolver(loginSchema)` (email required, format, ≤ 256;
   password required, ≤ 128); `useLoginMutation` → `signIn` → navigate to
   `getSafeRedirect(searchParams.get("redirect"))`. 401 → form-level alert "The email or password
   is incorrect." + `resetField("password")` + focus; 400 → `setError` per field; 429 → "Too many
   attempts. Try again in N seconds."; status 0 → "Can't reach the server…" (email kept).
   Already signed in → `<Navigate to="/" replace />`.
5. **Safe redirect**: accept only paths starting with a single `/` (reject `//`, `/\`, schemes,
   `/login` loops); fallback `/`.
6. **RequireAuth** layout route: signed out → `<Navigate to="/login?redirect=<path+search>" replace />`;
   route `handle: { requiresAuth: true }` used by sign-out to decide where to go.
7. **Expiry**: `SessionWatcher` (in AppShell) schedules `signOut("expired")` at `expiresAt`
   (re-scheduled on change; long timeouts capped and re-armed); shows toasts for expired/rejected
   and a "Signed out" toast for manual; on protected routes `RequireAuth` then redirects with the
   return address. On sign-out the query cache entries under `["auth"]` are removed.
8. **Account page**: `useCurrentUserQuery` (`["auth","me"]`, GET `/auth/me`): Skeleton shaped like
   the definition list → email (`UserText`), role badges, "Session ends at HH:MM (in N min)";
   ErrorState + Retry.
9. **Header** (`AuthMenu`): signed out → "Sign in" link with return address; signed in → email
   (truncated, full in `title`) + "Sign out" button; nav gains "My account".
10. **Design** (frontend-design): sign-in page reuses the system (indigo ink, saffron focus ring,
    Readex Pro); left-aligned single column with the level-meter mark at rest (muted bars) next to
    the heading "Sign in to manage the catalog"; no decorative imagery.
11. **CI**: `actions/checkout@v7`, `actions/setup-node@v7` (node24).

## Complexity Tracking

None.
