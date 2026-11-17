# Implementation Plan: Track Distribution to DSPs (Web app)

**Branch**: `005-track-distribution-to-dsps` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-track-distribution-to-dsps/spec.md`

**Skills applied**: react-frontend-stack, frontend-design, git-workflow, decisions-log

## Summary

The track page gets a deliveries table (platform, status badge, sent and answer times; stacked on
phones). Admins get a **Distribute** dialog (a checkbox per platform; pending/live disabled,
rejected "Send again") and, on pending rows, **Mark live** / **Mark rejected**. "Mark as distributed"
and the "without platform deliveries" text are removed; status buttons still come only from
`allowedNextStatuses` (the API no longer offers distributed by status change). Types are regenerated
from the backend 005 contract.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict), React 19.3.1, Node 26.13.1

**Primary Dependencies**: as Phase 3. **No new packages.** New shadcn-style component file
`dialog.tsx`, hand-written on the installed `radix-ui` 1.8.1 (the shadcn CLI injects the unrelated
`cn` package – Phase 0, 1 and 3).

**Storage**: none (server state in TanStack Query).

**Testing**: Vitest + RTL + MSW 3; real-browser check with the scratch Edge DevTools script.

**Target Platform**: modern browsers, 360 px and up, light and dark.

**Project Type**: web app (SPA)

**Performance Goals**: initial JS < 250 kB gzip (CI); the platform list is fetched once and cached.

**Constraints**: admin-only controls; the API decides what is allowed (`canDistribute`,
`allowedAnswers`, `allowedNextStatuses`).

**Scale/Scope**: 1 page changed, ~6 components/hooks, 1 regenerated contract.

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Contract-first | `gen:api` from backend `005…/contracts/openapi.json`; delivery status union from the contract | ✅ |
| II. Clear state ownership | track detail and platforms in TanStack Query; mutations write the returned detail into the cache | ✅ |
| III. Every state designed | detail skeleton incl. deliveries; empty deliveries; dialog loading/error/submitting; row answer pending; conflict | ✅ |
| IV. Tests ship with features | table (visitor/admin, states, times), dialog (options, disabled, count, send, conflict, 401), answers, removed texts | ✅ |
| V. Security-aware client | controls only for admins; platform names via `UserText` | ✅ |
| VI. Spec-driven | walkthrough Phase 4 + Memory.md in the PR | ✅ |
| VII. Simplicity & licenses | no packages; native checkboxes in a radix dialog | ✅ |

## Project Structure

```text
src/api/tracks.ts                 # + distributeTrack(id, dspIds), recordDistributionAnswer(id, dspId, status)
src/api/dsps.ts                   # listDsps()
src/components/ui/dialog.tsx      # shadcn-style dialog on radix-ui (hand-written)
src/features/tracks/
  catalog.ts                      # + DISTRIBUTION_STATUS_LABEL, ANSWER_ACTION, typed against the contract
  hooks/useTrackQueries.ts        # + useDistributeTrackMutation, useRecordAnswerMutation
  hooks/useDspsQuery.ts           # platforms, staleTime Infinity
  components/DistributionsSection.tsx  # table (sm+) / stacked rows; badges; times; admin answer buttons
  components/DistributionStatusBadge.tsx
  components/DistributeDialog.tsx # checkboxes, disabled with status, "Send to N platforms"
  components/StatusControl.tsx    # confirm dialog for distributed removed (never offered)
  components/TrackDetailSkeleton.tsx   # + deliveries rows
  pages/TrackDetailPage.tsx       # Distribute button next to the status control
```

## Key design decisions (details in research.md)

1. **API decides** (R1): Distribute shown when `canDistribute`; answer buttons from each delivery's
   `allowedAnswers`; status buttons from `allowedNextStatuses`. No rule tables in the client.
2. **Dialog options** (R2): platforms from `GET /api/dsps` (cached); a platform is selectable when it
   has no delivery or its delivery is rejected ("Send again"); pending/live are disabled and show their
   status. All selectable done → the button is disabled with "Sent to every platform".
3. **Cache** (R3): both mutations return the track; `setQueryData(detail)` + invalidate lists (status
   badge in the catalogue). 409 → toast with the API's detail + refetch the detail (dialog closes);
   401 → Phase 1 sign-out.
4. **Badges and times** (R4, frontend-design): pending saffron, live teal, rejected rose – always with
   the word; sent time and answer time via `formatDateTime` in a `<time>`; "Waiting" while pending.
5. **Answer buttons** (R5, Q5): "Mark live" / "Mark rejected" on pending rows, no confirmation; a
   one-line note "Platform answers are simulated." above the table for admins.
6. **Removed** (FR-002, A6): `STATUS_ACTION.distributed`, the confirm dialog in `StatusControl`, the
   "without platform deliveries" text, and `src/components/ui/alert-dialog.tsx` (its only user was that
   confirmation).
7. **Existing data** (spec, Q1): no special case in the UI; README says to reset databases created
   before distributions (`docker compose down -v` in the backend repo).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Hand-written dialog component | shadcn CLI injects an unrelated package | Running the CLI and reverting each time |
