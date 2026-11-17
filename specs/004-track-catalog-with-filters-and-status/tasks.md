---
description: "Task list for Phase 3 – Track Catalog with Filters and Status (Web app)"
---

# Tasks: Track Catalog with Filters and Status (Web app)

**Input**: Design documents from `specs/004-track-catalog-with-filters-and-status/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md, quickstart.md; backend Phase 3 merged (contract)
**Tests**: REQUIRED by the constitution (Principle IV).
**Skills**: react-frontend-stack (all code), frontend-design (catalog, track page, form, dot), git-workflow, decisions-log

## Format: `[ID] [P?] [Story] Description` — paths relative to the frontend repo root.

---

## Phase 1: Setup

- [X] T001 Point `gen:api` at `../backend/specs/004-…/contracts/openapi.json`, regenerate `src/api/schema.d.ts`; check genre/status are literal unions
- [X] T002 `npx --no-install shadcn add alert-dialog` (pinned project tool); review package.json and imports (no `cn` package, no new deps)

---

## Phase 2: Foundational

- [X] T003 [P] Tests + `src/features/tracks/isrc.ts` (table mirroring the backend cases) and `src/lib/format.ts` `formatCalendarDate` (no shift under a negative-offset time zone)
- [X] T004 [P] Tests + `genres.ts`/`statuses.ts` (labels, order, typed `satisfies` against the contract unions; exhaustiveness)
- [X] T005 `src/api/tracks.ts` (list/get/create/changeStatus) and `src/api/artists.ts` (`searchArtists`, `getArtist`); MSW handlers + sample tracks in `src/test/server.ts` (filters, paging, detail, 404, transitions per the API table, 409)
- [X] T006 `queryKeys.ts`; move `Pagination` to `src/components` (artists tests stay green)
- [X] T007 [P] Tests + `hooks/useTrackFilters.ts` (parse, invalid ignored, filter change drops page, clear, history push)

---

## Phase 3: User Story 1 – Catalog home page (P1) 🎯 MVP

- [X] T008 [P] [US1] Tests `TracksPage.test.tsx`: skeleton, rows (title link, artist, genre, badge text, date), Arabic via `UserText`, status/genre/artist filters in URL + reload, combination, clear, paging + Back, empty (none / no matches; admin "Add track"), error + Retry, page past end
- [X] T009 [US1] `StatusBadge`, `TrackList` (+ skeleton; table from `sm`, stacked below), `TrackFilters` (native selects + artist picker), `TracksPage`; route `/` → TracksPage
- [X] T010 [P] [US1] Tests + `ArtistPicker` (combobox roles, empty focus lists the first 10, typing searches debounced, arrows/Enter/Escape, no matches, error, selected name; filter shows name from `getArtist`, "Unknown artist" on 404) and `useArtistSearch`/`useArtistQuery`

---

## Phase 4: User Story 2 – Track page (P1)

- [X] T011 [P] [US2] Tests `TrackDetailPage.test.tsx`: skeleton, all fields (ISRC hyphenated, dates), distributions empty state (wording for draft/submitted vs distributed), not found (404 and bad id), error + Retry, no controls for visitors
- [X] T012 [US2] `TrackDetailSkeleton`, `DistributionsSection`, `TrackDetailPage`; route `tracks/:id`

---

## Phase 5: User Story 3 – Add track (P1)

- [X] T013 [P] [US3] Tests `schemas.test.ts` (each rule/message, code points, ISRC forms, date range) and `NewTrackPage.test.tsx` (empty submit → 5 messages + focus first; server 400/409 under fields with values kept; 500/network form alert; pending button; success → track page + toast "Track added"; 401 → sign-out)
- [X] T014 [US3] `schemas.ts`, `useCreateTrackMutation` (seed detail cache, invalidate lists), `NewTrackPage` (Title `dir="auto"`, ArtistPicker, ISRC `dir="ltr"` + hint, genre select, date input); route `tracks/new` under `RequireAuth` with `requiresRole` ("Only admins can add tracks", back to the catalog)
- [X] T015 [P] [US3] Guard tests: "Add track" hidden for visitor/non-admin; `/tracks/new` signed out → sign-in → back; non-admin denied

---

## Phase 6: User Story 4 – Status control (P1)

- [X] T016 [P] [US4] Tests `StatusControl.test.tsx` / detail page: only `allowedNextStatuses` offered with the right labels; distributed asks for confirmation (cancel = no request); success updates badge, controls, list cache + toast; 409 → message + refetch; distributed → final note, no controls; visitors none; 401 during a change → Phase 1 sign-out and back to the track after signing in
- [X] T017 [US4] `StatusControl` (+ AlertDialog), `useChangeTrackStatusMutation`

---

## Phase 7: User Story 5 – Status dot (P3)

- [X] T018 [P] [US5] Tests `StatusDot.test.tsx` (each health state → colour class + accessible name; links to `/status`) and AppShell (Tracks link to `/`, Artists link, no "soon" items, Status page reachable)
- [X] T019 [US5] `StatusDot` in the header; `HomePage` → `StatusPage` at `/status`; AppShell nav; LoginPage "What signing in unlocks" list (add tracks, change status, add artists, see emails)

---

## Phase 8: Polish

- [X] T020 `npm run lint && npm run typecheck && npm test && npm run build`; bundle < 250 kB gzip; tests 3× green
- [X] T021 Real-browser run (scratch Edge DevTools script) on the full compose stack: quickstart 1–8, desktop light + 400 px dark, no overflow, no console errors; fix findings
- [X] T022 README (catalog, filters in the URL, track page, add track, status changes, status dot)
- [X] T023 `docs/walkthrough.md` Phase 3 section; Memory.md (repo + master)
- [X] T024 Frontend section of `docs/ai-log.md` Phase 3 in the backend repo (separate docs PR, as in Phase 2)

## Dependencies

- Backend T027 (contract) → T001. Setup → Foundational → US1 → US2 → US3/US4 (US4 needs the detail page); US5 independent after Setup.

## Implementation notes

- T002: `shadcn add alert-dialog` again injected the unrelated `cn` package and wanted to overwrite
  `button.tsx`; reverted, and `src/components/ui/alert-dialog.tsx` was written by hand on `radix-ui`.
- T007 / T016: the filter hook and the status control are tested through `TracksPage.test.tsx` and
  `TrackDetailPage.test.tsx` (behaviour as the user sees it) rather than separate unit files.
- T018: the dot's state is checked through its accessible name (`Service status: …`) and `data-state`,
  not colour classes.
- T024: written on the open backend Phase 3 PR branch (one PR to review instead of two).
- Two existing tests became timing-sensitive once `/` rendered the catalogue (session expiry test);
  given more margin / a `waitFor` – the behaviour is unchanged.
