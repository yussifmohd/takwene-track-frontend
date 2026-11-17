# Contracts: Foundation & Architecture (Web app)

## API contract (consumed, not owned)

Source of truth: `backend/specs/001-project-foundation-and-health-check/contracts/openapi.json`
(backend repo: https://github.com/yussifmohd/takwene-track-backend).

Operations used in Phase 0:

| Operation | Method & path | Success | Other statuses handled |
|---|---|---|---|
| `GetHealth` | `GET /api/health` | 200 `HealthReportDto` | 503 `HealthReportDto` (shown as unhealthy), network error / other 5xx (unreachable) |

Types are generated into `src/api/schema.d.ts` with `npm run gen:api`.

## UI route contract (owned)

| Path | View | Notes |
|---|---|---|
| `/` | Home – health status card | Becomes Track List in Phase 3 (health moves to header) |
| `/tracks`, `/artists` | not yet routed; nav items shown as "coming soon" | Phases 2–3 |
| `*` | Not found | Link back to `/` |
