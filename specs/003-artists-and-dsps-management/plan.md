# Implementation Plan: Artists (Web app)

**Branch**: `003-artists-and-dsps-management` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-artists-and-dsps-management/spec.md`

**Skills applied**: react-frontend-stack, frontend-design (list + form), git-workflow, decisions-log

## Summary

Add the public Artists page (`/artists`: paged list with skeleton, empty and error states, names
via `UserText dir="auto"`, countries by name, emails only for admins) and the admin-only Add artist
page (`/artists/new` under the auth guard, react-hook-form + zod mirroring the API rules, field
errors from 400/409 ProblemDetails, toast + list refresh on success). No new packages: country
names come from `Intl.DisplayNames`, the country picker is a native `<select>`.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.3.1, Node 26.13.1

**Primary Dependencies**: unchanged (react-router 8.5.1, TanStack Query 5.105.3, zustand 5.0.16,
react-hook-form 7.91.0, zod 4.6.7, shadcn/radix, sonner). **No new packages.**

**Storage**: n/a (server state in TanStack Query; page number in the URL)

**Testing**: Vitest 5.1.0 + RTL + MSW 3; real-browser check with the Phase 1 DevTools script (scratchpad)

**Target Platform**: modern browsers via nginx (8081)

**Project Type**: web SPA

**Performance Goals**: content or skeleton < 1 s locally (SC-005); bundle stays < 250 kB gzip
(country list ≈ 1 kB; names from the browser)

**Constraints**: emails never rendered for non-admins; types only from the backend contract

**Scale/Scope**: 2 pages, 1 API module, 2 hooks, 1 country module

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Contract-first | `npm run gen:api` against backend `003…/contracts/openapi.json`; `src/api/artists.ts` uses generated types | ✅ |
| II. Clear state ownership | list/create in TanStack Query (`artistKeys`), page in URL, auth from the Phase 1 store | ✅ |
| III. Every state designed | skeleton rows, empty (with/without action), empty page past end, error + Retry, submitting | ✅ |
| IV. Tests ship with features | page states, URL paging, email visibility, form client + server errors, guard, countries | ✅ |
| V. Security-aware client | admin-only control + guarded route; `UserText` (no HTML injection); no emails for visitors | ✅ |
| VI. Spec-driven | walkthrough Phase 2 section + Memory.md in the PR (constitution 1.1.0) | ✅ |
| VII. Simplicity & licenses | no new dependencies | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/003-artists-and-dsps-management/
├── spec.md  plan.md  research.md  data-model.md  quickstart.md
├── contracts/README.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (additions/changes)

```text
src/api/artists.ts                          # listArtists(params, signal), createArtist(body)
src/lib/countries.ts                        # 249 ISO codes, countryName(code), countryOptions()
src/components/EmptyState.tsx               # shared empty state (sentence + optional action)
src/features/artists/
  queryKeys.ts                              # artistKeys.all / lists() / list({ page, pageSize })
  schemas.ts                                # zod createArtistSchema (code-point lengths, country list, email)
  hooks/useArtistsQuery.ts                  # keepPreviousData between pages
  hooks/useCreateArtistMutation.ts          # invalidate lists, toast "Artist added"
  hooks/usePageParam.ts                     # ?page= ↔ number (invalid → 1)
  components/ArtistList.tsx, ArtistListSkeleton.tsx, Pagination.tsx, CountrySelect.tsx
  pages/ArtistsPage.tsx, NewArtistPage.tsx
src/features/auth/components/RequireAuth.tsx  # + optional role ("Admin") → "not allowed" state
src/components/AppShell.tsx                 # Artists becomes a real nav link
src/router.tsx                              # /artists (public), /artists/new (RequireAuth role=Admin)
src/test/server.ts                          # artist fixtures/handlers
```

**Structure Decision**: new `features/artists` slice following `features/auth` and `features/health`.

## Key design decisions (details in research.md)

1. **Countries**: `src/lib/countries.ts` holds the same 249 codes as the API; a test asserts the
   count and the same SHA-256 as the backend test (cross-repo drift check). Names from
   `new Intl.DisplayNames(["en"], { type: "region" })`; unknown code → the code itself (R1).
2. **Picker**: native `<select>` of names sorted with `localeCompare`, placeholder "Choose a
   country"; keyboard type-to-jump and screen-reader support come free (R2).
3. **Paging in the URL**: `?page=N` (invalid/≤0 → 1), page size fixed at 20 in the UI;
   `placeholderData: keepPreviousData` so paging does not flash the skeleton (R3).
4. **Email visibility**: rendered only when `useIsAdmin()` and present in the DTO (the API already
   omits it for visitors) (R4).
5. **Form**: zod mirrors API limits (name 1–200 code points via `[...value].length`, country in list,
   email optional ≤ 254 with the same format rule as login). Server 400/409 → `getFieldErrors` →
   `setError` on `name`/`countryCode`/`email`; other errors → form alert (`describeError`) (R5).
6. **Admin guard**: `RequireAuth` gets an optional `role` (handle `requiresRole: "Admin"`); a signed-in
   non-admin sees "Only admins can add artists" instead of the form (R6).
7. **Success**: `invalidateQueries(artistKeys.lists())`, `navigate("/artists")`, toast "Artist added" (R7).
8. **Layout**: a table on ≥ sm (Name, Country, Email for admins, Added) that becomes stacked rows
   below sm; long names wrap (`break-words`) (frontend-design pass on the real stack).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Country code list duplicated in both repos | Picker needs the list at runtime; the API has no countries endpoint | A countries endpoint is unrequested scope; hash test catches drift |
