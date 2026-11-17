---
description: "Task list for Phase 4 – Track Distribution to DSPs (Web app)"
---

# Tasks: Track Distribution to DSPs (Web app)

**Input**: Design documents from `specs/005-track-distribution-to-dsps/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md; backend 005 contract exported
**Tests**: REQUIRED by the constitution (Principle IV).
**Skills**: react-frontend-stack, frontend-design, git-workflow, decisions-log

## Format: `[ID] [P?] [Story] Description` — paths relative to the frontend repo root.

---

## Phase 1: Setup

- [ ] T001 Point `gen:api` at `../backend/specs/005-track-distribution-to-dsps/contracts/openapi.json`; regenerate `src/api/schema.d.ts`; check the delivery status and answer unions
- [ ] T002 Hand-write `src/components/ui/dialog.tsx` (shadcn shape on `radix-ui` `Dialog`); no package changes

---

## Phase 2: Foundational

- [ ] T003 [P] `src/api/dsps.ts` (`listDsps`), `src/api/tracks.ts` (+ `distributeTrack`, `recordDistributionAnswer`); MSW: `dspsHandler`, `trackDetail()` with deliveries, distribute/answer handlers that apply the API rules
- [ ] T004 [P] `catalog.ts` labels for delivery status and answers, typed `satisfies` against the contract unions; `useDspsQuery`; mutations (setQueryData detail + invalidate lists)

---

## Phase 3: User Story 1 – Deliveries table (P1)

- [ ] T005 [P] [US1] Tests (`TrackDetailPage.test.tsx`): table rows ordered as the API returns (name, badge word, sent time, answer time / "Waiting"); empty "Not sent to any platform yet." for every status; skeleton includes the section; visitor sees no controls; the "without platform deliveries" text is gone
- [ ] T006 [US1] `DistributionStatusBadge`, `DistributionsSection` (table from `sm`, stacked below, `UserText` names, `<time>`); `TrackDetailSkeleton` rows

---

## Phase 4: User Story 2 – Distribute (P1)

- [ ] T007 [P] [US2] Tests `DistributeDialog` via the page: shown only when `canDistribute` and admin; options (selectable / "Send again" / disabled with status); button disabled until a choice, names the count; send → progress, closes, toast, rows pending, badge distributed; no-op toast; "Sent to every platform" disabled state; 409 → toast + refetch + close; 401 → sign-out to `/login?redirect=`; platforms load error → Retry; keyboard (Escape closes, focus returns)
- [ ] T008 [US2] `DistributeDialog` + Distribute button on `TrackDetailPage`; `StatusControl` without the distributed confirmation; remove `alert-dialog.tsx` if unused
- [ ] T009 [P] [US2] Tests: submitted track offers only "Withdraw to draft" (from `allowedNextStatuses`); "Mark as distributed" never rendered

---

## Phase 5: User Story 3 – Answers (P2)

- [ ] T010 [P] [US3] Tests: pending rows show "Mark live"/"Mark rejected" for admins only (from `allowedAnswers`); click → busy, row updates with answer time, toast names the platform; live/rejected rows show none; 409 → toast + refetch
- [ ] T011 [US3] Answer buttons in `DistributionsSection`; admin note "Platform answers are simulated."

---

## Phase 6: Polish

- [ ] T012 `npm run lint && npm run typecheck && npm test && npm run build`; bundle < 250 kB gzip; tests 3× green
- [ ] T013 Real-browser run (scratch script) on the compose stack: quickstart 1–8, desktop light + 400 px dark
- [ ] T014 README (deliveries, Distribute, answers, removed texts, existing data), `docs/walkthrough.md` Phase 4, `Memory.md` (repo + master)
- [ ] T015 Frontend section of `docs/ai-log.md` Phase 4 in the backend repo (on the open backend PR branch if still open, else a docs PR)

## Dependencies

Backend contract → Setup → Foundational → US1 → US2 → US3 → Polish.
