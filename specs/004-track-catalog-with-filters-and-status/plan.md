# Implementation Plan: Track Catalog with Filters and Status (Web app)

**Branch**: `004-track-catalog-with-filters-and-status` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-track-catalog-with-filters-and-status/spec.md`

**Skills applied**: react-frontend-stack, frontend-design, git-workflow, decisions-log

## Summary

Make the catalog the home page: `/` lists tracks (title, artist, genre, status badge, release date)
with status, genre and artist filters and the page in the address. `/tracks/:id` shows a track, its
(empty) distributions and, for admins, the allowed status changes (distributed asks for
confirmation). `/tracks/new` (admin only) adds a track with an artist picker that searches by name.
The Phase 0 status page moves to `/status`; a status dot in the header links there; "Tracks" becomes a
real navigation link. Types are regenerated from the backend 004 contract.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict), React 19.3.1, Node 26.13.1

**Primary Dependencies**: as Phase 2. **No new packages.** New shadcn component file
`alert-dialog.tsx` (built on the already installed `radix-ui` 1.8.1; review package.json and imports
after `shadcn add`, it injected `cn` before).

**Storage**: none (server state in TanStack Query, filters in the URL, session in zustand).

**Testing**: Vitest + RTL + MSW 3; real-browser check with the scratch Edge DevTools script.

**Target Platform**: modern browsers, 360 px and up, light and dark.

**Project Type**: web app (SPA)

**Performance Goals**: content or skeleton < 1 s locally (SC-005); initial JS < 250 kB gzip (CI).

**Constraints**: admin-only controls hidden and routes guarded; API is the authority on status rules.

**Scale/Scope**: 3 pages (+ moved status page), ~12 components/hooks, 1 regenerated contract.

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Contract-first | `gen:api` from backend `004…/contracts/openapi.json`; genre/status literal unions from the contract | ✅ |
| II. Clear state ownership | tracks/artists in TanStack Query (`trackKeys`, `artistKeys`); filters + page in the URL; session from the Phase 1 store | ✅ |
| III. Every state designed | list/detail skeletons, empty (none / no matches), error + Retry, not found, submitting, status change pending, conflict | ✅ |
| IV. Tests ship with features | filters/URL, list states, detail, status control (allowed only, confirm, 409), form (client + server errors), picker keyboard, header dot | ✅ |
| V. Security-aware client | admin-only controls + guarded route; `UserText` for titles/names; no new storage | ✅ |
| VI. Spec-driven | walkthrough Phase 3 + Memory.md in the PR | ✅ |
| VII. Simplicity & licenses | no new packages (own ARIA combobox, native selects and date input) | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/004-track-catalog-with-filters-and-status/
├── spec.md  plan.md  research.md  data-model.md  quickstart.md
├── contracts/README.md          # points to the backend contract + intent
├── checklists/requirements.md
└── tasks.md
```

### Source Code (additions/changes)

```text
src/api/tracks.ts                 # listTracks, getTrack, createTrack, changeTrackStatus
src/api/artists.ts                # + searchArtists(term), getArtist(id)
src/lib/format.ts                 # + formatCalendarDate("2026-12-01") (no time-zone shift)
src/features/tracks/
  queryKeys.ts                    # ["tracks","list",filters] / ["tracks","detail",id]
  genres.ts, statuses.ts          # labels + order; typed against the contract unions
  isrc.ts                         # normalise/format/validate (same rule as the API)
  schemas.ts                      # zod create-track schema
  hooks/useTrackFilters.ts        # status/genre/artistId/page ⇄ URL, invalid ignored, filter change → page 1
  hooks/useTracksQuery.ts, useTrackQuery.ts, useCreateTrackMutation.ts, useChangeTrackStatusMutation.ts
  components/TrackList.tsx (+ skeleton), StatusBadge.tsx, TrackFilters.tsx,
             StatusControl.tsx (+ confirm), DistributionsSection.tsx, TrackDetailSkeleton.tsx
  pages/TracksPage.tsx, TrackDetailPage.tsx, NewTrackPage.tsx
src/features/artists/components/ArtistPicker.tsx  # ARIA combobox (search as you type, keyboard)
src/features/artists/hooks/useArtistSearch.ts, useArtistQuery.ts
src/features/artists/components/Pagination.tsx → src/components/Pagination.tsx (shared)
src/features/health/components/StatusDot.tsx      # header dot → /status
src/pages/StatusPage.tsx (was HomePage.tsx), router.tsx, components/AppShell.tsx, LoginPage "unlocks" list
src/components/ui/alert-dialog.tsx                # shadcn
```

## Key design decisions (details in research.md)

1. **Filters in the URL** (R1): `useTrackFilters` parses `status`/`genre` against the contract lists,
   `artistId` as a GUID, `page` ≥ 1; anything invalid is ignored. Setting a filter removes `page`;
   "Clear filters" removes all. History entries are pushed (Back works).
2. **Server decides allowed changes** (R2): the status control renders `allowedNextStatuses` from
   the detail response – no transition table in the client. Labels: submitted ← "Submit" (from draft),
   draft ← "Withdraw to draft", distributed ← "Mark as distributed" (AlertDialog confirmation).
3. **Cache updates** (R3): create → `setQueryData(detail)`, invalidate lists, navigate to the track;
   status change → `setQueryData(detail, response)` + invalidate lists; 409 → toast with the API's
   `detail` + refetch the detail; 401 → Phase 1 sign-out (returns to the track).
4. **Artist picker** (R4): own WAI-ARIA combobox (input + listbox, `aria-activedescendant`, arrows/
   Enter/Escape), debounced 250 ms search `GET /api/artists?search=&pageSize=10`, shows the chosen
   artist's name; used by the form and the list's artist filter. The filter shows the name of an
   artist from the URL via `GET /api/artists/{id}` ("Unknown artist" on 404).
5. **ISRC input** (R5): text input `dir="ltr"`, `autoCapitalize="characters"`, any case/hyphens;
   zod refine with the API's rule; the page shows the format hint "CC-XXX-YY-NNNNN, e.g.
   EG-A1B-26-00001"; values are sent trimmed (the API normalises).
6. **Dates** (R6): native `<input type="date">` (value `YYYY-MM-DD`, accessible, mobile-native);
   release dates displayed with `formatCalendarDate` (UTC formatting, no shift).
7. **Status page move** (R7): Phase 0 page → `/status`; `StatusDot` in the header reuses
   `useHealthQuery` (same cache, 30 s refresh) – one source; dot colour + `aria-label` "Service
   status: healthy" and a visible tooltip-free label on hover via `title`.
8. **Visual** (frontend-design): status badges use the existing tokens – draft neutral ink,
   submitted saffron, distributed teal – with text labels (never colour alone); list = table from
   `sm`, stacked rows below (Phase 2 pattern); titles link to the detail page.
9. **Shared pieces**: `Pagination` moves to `src/components` (artists + tracks).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Hand-written combobox | FR-007 (type to find artists) without adding a package | Native select can't search a server-side list; cmdk adds a dependency for one widget |
