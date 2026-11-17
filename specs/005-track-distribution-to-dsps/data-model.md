# Data Model: Track Distribution (Web app)

From the backend 005 contract (`npm run gen:api`):

- `TrackDetailDto` + `canDistribute: boolean`; `distributions: TrackDistributionDto[]` (ordered by name).
- `TrackDistributionDto`: `dspId`, `dspName`, `status: "pending" | "live" | "rejected"`, `submittedAtUtc`,
  `answeredAtUtc: string | null`, `allowedAnswers: ("live" | "rejected")[]`.
- `DspDto`: `id`, `name` (`GET /api/dsps`).

Client-side labels (`catalog.ts`, typed against the contract unions):

| Value | Badge | Answer button | Toast |
|---|---|---|---|
| pending | "Pending" (saffron) | – | – |
| live | "Live" (teal) | "Mark live" | "{platform} is live" |
| rejected | "Rejected" (rose) | "Mark rejected" | "{platform} rejected the track" |

Dialog option state per platform: no delivery → selectable; rejected → selectable "Send again";
pending/live → disabled with the badge. Distribute toast: "Sent to 1 platform" / "Sent to N platforms";
when nothing changed (all were pending/live meanwhile): "Already sent to these platforms".

Query keys: `["dsps"]` (staleTime Infinity); tracks keys unchanged.
