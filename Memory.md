# Memory – frontend (repo snapshot)

> Synced from the master Memory.md at the end of each phase. Master lives outside the repos.

## Conventions
- React 19 + TS 5.9.3 strict + Vite 8; feature folders `src/features/<f>/{components,hooks}`; shared UI in `src/components`, shadcn in `src/components/ui`.
- Server state: TanStack Query only. Client state: zustand (auth from Phase 1). Filters in the URL.
- All HTTP through `apiFetch` (`src/api/client.ts`), base `/api`; errors are `ApiError` with ProblemDetails; `showProblemToast` for toasts, `getFieldErrors` for forms.
- Types from the backend contract: `npm run gen:api` → `src/api/schema.d.ts` (committed, never hand-edited).
- Every state designed: Skeleton shaped like the content, ErrorState with Retry, empty states.
- User-entered text through `UserText` (`dir="auto"`). No `dangerouslySetInnerHTML` (lint rule).
- Design tokens in `src/index.css`: indigo ink, saffron accent, teal/rose status, Readex Pro; dark mode via `prefers-color-scheme`.
- Tests: Vitest + RTL + MSW 3 (`onUnhandledFrame: "error"`), co-located `*.test.ts(x)`.
- Exact pins (`npm i -E`), license check first. shadcn `add` injects the unrelated `cn` package and `from "cn"` imports (happened in Phase 0 and 1): always review package.json and imports after it. Don't run unpinned `npx` tools (e.g. prettier) – not a project dependency.
- Auth (Phase 1): session in `useAuthStore` (`trackmgmt.session`, v1, zod-validated, key removed when signed out). `setupAuth()` wires `apiFetch` (valid token only; 401 → signOut("rejected")) and cross-tab sync. Calls where 401 is an answer use `skipAuthHandling` (login).
- Protected pages: children of the `RequireAuth` route (`handle.requiresAuth`). `RouterProvider` comes from `react-router/dom`.
- Sign-out: every sign-out lands on `/login`. `signOut(reason)` clears session + storage; `SessionWatcher` alone finishes it (drop `["auth"]` cache, redirect via `signOutDestination`, explain, acknowledge after the new page shows). Manual → `/login` + toast; expired/401 → `/login?redirect=` + note on the sign-in page; other tab → only protected pages leave. `RequireAuth` renders nothing while a sign-out is pending. New signed-in queries must live under `["auth", …]` or be removed there too.
- Return addresses only through `safeRedirect` / `loginPathFor`.
- Role-only pages: put `handle.requiresRole = { role, deniedTitle, backTo }` on a route under `RequireAuth`.
- Artists (Phase 2): list keys `artistKeys` (`["artists", …]`), removed on sign-out (cached emails); emails rendered only when `useIsAdmin()`. Page number in `?page` via `usePageParam`. Country list `src/lib/countries.ts` = API list (hash test); names via `Intl.DisplayNames` + override `PS` → "Palestine". Form schemas: zod 4 `min(1, { error, abort: true })` so "required" wins over later checks; lengths in code points (`[...s].length`).
- Contract: `npm run gen:api` reads `../backend/specs/005-track-distribution-to-dsps/contracts/openapi.json` (update **both** paths in the script each phase that changes the API: generator + stamp).
- Session rules (fix after Phase 1): storage and memory always agree – the storage adapter validates on read and removes rejected entries; "signed in" = store holds a session (no `Date.now()` in selectors); expiry only via `endExpiredSession()`; storage listener also handles `key === null`. Toasts are bottom-right (fixed in the Toaster wrapper) so they never cover the header.
- Tracks (Phase 3): home page `/` = catalogue; filters + page in the URL via `useTrackFilters` (invalid values ignored, filter change drops page). `trackKeys` (`["tracks", …]`) stay cached on sign-out (no personal data). Genres/statuses in `features/tracks/catalog.ts` typed against the contract unions. Status buttons come only from the API's `allowedNextStatuses`; 409 → toast + refetch. Release dates are calendar dates → `formatCalendarDate` (UTC). Distributions empty state: "Not sent to any platform yet."
- Distribution (Phase 4): `DistributionsSection` (table, stacked below `sm`; Distribute in the heading; answer buttons from `allowedAnswers`; note "Platform answers are simulated.") and `DistributeDialog` (checkboxes from `useDspsQuery`, pending/live disabled, rejected "Send again", "Send to N platforms", disabled "Sent to every platform"; no-op = unchanged `updatedAtUtc` → "Already sent to these platforms"). `StatusControl` never offers distributed (`STATUS_ACTION` is partial). Hand-written `ui/dialog.tsx`; `alert-dialog.tsx` removed. MSW `serveTrack()` applies the API rules for one track.
- Selects: only `components/ui/native-select.tsx` renders `<select>` (test); styles only in `index.css` "Selects" (themed options + `@supports (appearance: base-select)`), tokens only. `--highlight` = accent tint for highlighted list rows (picker too). Light `--ring` `#9a6500` (3:1+). Form prompt options are `disabled`.
- Phones: `main` has `pb-32` below `sm` so the last row can scroll above a toast (found in the browser run).
- No special case for "distributed without deliveries": backend DBs created before Phase 4 are reset with `docker compose down -v`.
- README rule (constitution v1.2.0): README describes the finished product (fixed structure, no phase numbers or changelogs), updated only where the product changed.
- `ArtistPicker` (own WAI-ARIA combobox, no package): first 10 on focus, 250 ms debounced `?search=`, keyboard; selected name via `useArtistQuery` for URL filters ("Unknown artist" on 404).
- Health: `StatusDot` in the header (same query as the card) → `/status` (`StatusPage`). shadcn components are written by hand (CLI injects `cn`).
- MSW defaults now include `tracksHandler()` (filters + paging), `trackDetail()` builder, `artistsHandler` supports `search`.
- Hardening (Phase 5): font self-hosted (`public/fonts/*.woff2` + `OFL.txt`, `@font-face` in `index.css`); no third-party host anywhere (`src/thirdPartyHosts.test.ts`). nginx security headers live ONLY in `nginx/security-headers.conf`, included in every location that serves files (`/`, `/assets/`); never add `add_header` at server level or a location without the include; `/api/` keeps the API's headers. shadcn CLI removed (components are hand-written); `overrides` minimatch 11.0.4. Accepted: picomatch GHSA-fc5q-39xc-vjpf (dev tools only, no fix; `npm audit --omit=dev` = 0).
- Reload tests: `sessionConsistency.test.tsx` `reload()` helper (unmount → restore storage → `persist.rehydrate()` → render). Prove a regression test fails on the old code (stash the fix) before trusting it.

## Pinned versions
Node 26.13.1 · react 19.3.1 · react-router 8.5.1 · @tanstack/react-query 5.105.3 · zustand 5.0.16 · react-hook-form 7.91.0 · zod 4.6.7 ·
tailwindcss 4.3.4 · radix-ui 1.8.1 · sonner 2.0.8 · lucide-react 1.66.0 · vite 8.3.5 · typescript 5.9.3 ·
vitest 5.1.0 · jsdom 30.1.3 · RTL 16.3.3 · @testing-library/dom 10.4.2 · msw 3.0.3 · eslint 10.14.0 · typescript-eslint 8.72.1 · globals 17.14.0 ·
openapi-typescript 7.13.0 · override minimatch 11.0.4 (BlueOak-1.0.0, 2026-11-02) · Readex Pro woff2 (OFL-1.1, from google/fonts) · images node:26.13.1-alpine, nginxinc/nginx-unprivileged:1.30.6-alpine.
- **Security exception (user decision 2026-11-18)**: the web runtime stage runs `apk del curl && apk upgrade --no-cache` as root, then `USER 101`; base tag unchanged. Trivy 0.76.1 before: 61 (1 CRITICAL brotli-libs CVE-2026-111497, 12 HIGH: libexpat ×4, libxslt ×3, curl/libcurl CVE-2026-92392, musl/musl-utils CVE-2026-107891, zlib CVE-2026-85091; 4 MEDIUM, 44 LOW); after (`--no-cache` rebuild, Alpine 3.24.4): 0. Packages are not pinned because Alpine removes superseded versions (the build would break). **Re-scan the image with Trivy on every rebuild.** Proposed (not added): a CI step running the `aquasec/trivy:0.76.1` image against the built image, failing on HIGH/CRITICAL.

## State
- Phase 0 (`001-project-foundation-and-health-check`): implemented; status page with health card, app shell, Docker on 8081, CI.
- Phase 1 (`002-jwt-authentication-and-authorization`): login page, persisted session, RequireAuth + account page, header menu, expiry/401/cross-tab sign-out; CI on Node 24 actions; 81 tests.
- Fix `fix-sign-out-session-state-after-reload` (after Phase 1): stale stored session after reload, header covered by toasts, cross-tab clear; 93 tests.
- Change `fix-sign-out-redirect-and-screen-state`: sign-out lands on `/login` (reported bug was a UX expectation; not reproducible as a failure); 95 tests.
- Phase 2 (`003-artists-and-dsps-management`): public artists list (paging in URL, countries by name, emails admin-only), admin-only Add artist with client + server field errors, role-aware guard; 132 tests; bundle 181 kB gzip.
- Phase 3 (`004-track-catalog-with-filters-and-status`): tracks catalogue at `/` (filters in URL), track page with admin status control + distributions empty state, add track with artist picker and ISRC checks, header status dot → `/status`; 200 tests; bundle 200.7 kB gzip.
- Phase 4 (`005-track-distribution-to-dsps`): deliveries table, Distribute dialog, simulated answers, "Mark as distributed" removed, README rewritten to the README rule; 214 tests; bundle 202 kB gzip.
- Phase 5 (`006-seed-data-security-hardening-and-docs`): self-hosted font, nginx header snippet, shadcn CLI removed, minimatch override, image upgrade (exception), README finished; E2E on the full stack with sample data (Edge, desktop/400 px × light/dark); 223 tests; bundle 202 kB gzip.
- Next: nothing planned for the web app (Phase 6 is backend-only AWS scripts).
