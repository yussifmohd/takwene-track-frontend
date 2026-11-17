# Research: Track Distribution to DSPs (Web app)

## R1 – Who decides what is allowed
- Decision: render only what the API lists (`canDistribute`, `allowedAnswers`, `allowedNextStatuses`).
- Rationale: one rule table (backend domain); Phase 3 showed client copies drift.

## R2 – Choosing platforms
- Decision: native checkboxes in a radix Dialog; options from `GET /api/dsps`; pending/live disabled
  with a status label; rejected labelled "Send again"; nothing preselected.
- Alternatives: a multi-select combobox – three options don't need search; checkboxes are the most
  accessible multi-choice control.

## R3 – Updating the page
- Decision: write the returned `TrackDetailDto` into the detail cache; invalidate track lists; on 409
  refetch the detail and close the dialog.

## R4 – Badges and times
- Decision: `DistributionStatusBadge` (word + tone: pending saffron, live teal, rejected rose);
  `formatDateTime` for sent/answer times (viewer's time zone); "Waiting" while pending.

## R5 – Answer control
- Decision: two small buttons per pending row; busy state on the pressed one; no confirmation (Q5).
- Rationale: it is a simulation; live is final but confirmation on every row would slow review.

## R6 – Dialog component
- Decision: hand-written `dialog.tsx` following shadcn's component on `radix-ui` (`Dialog` export).
- Rationale: same reason as `alert-dialog.tsx` in Phase 3 (CLI injects `cn`).
