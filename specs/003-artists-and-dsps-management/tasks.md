---
description: "Task list for Phase 2 – Artists (Web app)"
---

# Tasks: Artists (Web app)

**Input**: Design documents from `specs/003-artists-and-dsps-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md, quickstart.md;
backend contract `../backend/specs/003-artists-and-dsps-management/contracts/openapi.json`
**Tests**: REQUIRED by the constitution (Principle IV).
**Skills**: react-frontend-stack (all code), frontend-design (T018), git-workflow, decisions-log

## Format: `[ID] [P?] [Story] Description` — paths relative to the frontend repo root.

---

## Phase 1: Setup

- [ ] T001 Point `gen:api` at the backend 003 contract and regenerate `src/api/schema.d.ts` (needs backend T033)

---

## Phase 2: Foundational

- [ ] T002 [P] Tests `src/lib/countries.test.ts`: 249 codes, same SHA-256 as the backend constant, `countryName("EG")` → "Egypt", unknown → code, options sorted by name
- [ ] T003 [P] `src/lib/countries.ts` (R1)
- [ ] T004 [P] `src/api/artists.ts` (`listArtists`, `createArtist`) typed from the schema; `src/features/artists/queryKeys.ts`; MSW fixtures/handlers in `src/test/server.ts` (Arabic + Latin names, paged)
- [ ] T005 [P] `src/components/EmptyState.tsx` (sentence + optional action)
- [ ] T006 Sign-out also removes `artistKeys.all` (cached admin emails) in `SessionWatcher` + test (R4)

---

## Phase 3: User Story 1 – Anyone browses the artists (P1) 🎯 MVP

### Tests
- [ ] T007 [P] [US1] `src/features/artists/pages/ArtistsPage.test.tsx`: skeleton → rows with country names; `dir="auto"` on names; empty state (no action signed out); error + Retry; `?page=2` requests page 2, Next/Previous update the URL and disable at the ends; invalid `?page` → 1; page past end → "Go to page 1"; no email column signed out, emails as admin
- [ ] T008 [P] [US1] `hooks/usePageParam.test.ts`

### Implementation
- [ ] T009 [US1] `hooks/usePageParam.ts`, `hooks/useArtistsQuery.ts` (`keepPreviousData`)
- [ ] T010 [US1] `components/{ArtistList, ArtistListSkeleton, Pagination}.tsx`, `pages/ArtistsPage.tsx`
- [ ] T011 [US1] Route `/artists`; AppShell "Artists" becomes a real link (no "soon" pill)

---

## Phase 4: User Story 3 – Visitors cannot reach the create form (P1)

### Tests
- [ ] T012 [P] [US3] `RequireAuth.test.tsx` additions: signed out on `/artists/new` → sign-in then back; signed in without Admin role → "Only admins can add artists"; "Add artist" hidden for visitors and non-admins

### Implementation
- [ ] T013 [US3] `RequireAuth` optional `handle.requiresRole` (R6); `useIsAdmin` selector if missing; route `/artists/new` under the guard

---

## Phase 5: User Story 2 – Admin adds an artist (P1)

### Tests
- [ ] T014 [P] [US2] `src/features/artists/schemas.test.ts` (200/201 code points incl. Arabic/emoji, email required/format/254, country in list)
- [ ] T015 [P] [US2] `pages/NewArtistPage.test.tsx` (MSW): empty submit → messages for Name, Country and Email, focus Name, no request; 400 field errors placed; 409 → message under Email, values kept; 500/network → form alert; submitting disables button; success → `/artists`, toast "Artist added", list refetched; 401 → Phase 1 sign-out; name input `dir="auto"`

### Implementation
- [ ] T016 [US2] `schemas.ts`, `hooks/useCreateArtistMutation.ts`, `components/CountrySelect.tsx`
- [ ] T017 [US2] `pages/NewArtistPage.tsx`; "Add artist" button on ArtistsPage (admin only) and in the admin empty state

---

## Phase 6: Polish & cross-cutting

- [ ] T018 Apply frontend-design to the list and form (Phase 0 tokens, table ≥ sm / stacked < sm, long names wrap, 360 px, dark mode, focus)
- [ ] T019 Real-browser check with the DevTools script on compose (quickstart 1–9; Arabic/Latin mixed list, light/dark, 360 px/desktop); fix findings
- [ ] T020 `npm run lint && npm run typecheck && npm test && npm run build` (bundle < 250 kB gzip); `docker compose up --build`
- [ ] T021 README: Artists pages, admin-only form
- [ ] T022 Add this phase's section to `docs/walkthrough.md` and update Memory.md (REQUIRED by the constitution's Definition of Done)
- [ ] T023 Frontend section of backend `docs/ai-log.md` Phase 2 (AI usage, mistakes, developer-notes placeholder)

## Dependencies

- T001 needs the backend contract; T002 needs the SHA-256 constant from backend T003. Foundational → US1 → US3 (guard) → US2 (form behind the guard). Polish last.
