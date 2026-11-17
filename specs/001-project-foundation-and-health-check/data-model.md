# Data Model: Foundation & Architecture (Web app)

Client-side view models only; all shapes come from the backend contract
(`components.schemas` in `src/api/schema.d.ts`).

| Type (generated) | Fields | Used by |
|---|---|---|
| `HealthReportDto` | `status: "healthy" \| "degraded" \| "unhealthy"`, `checkedAt: string`, `checks: HealthCheckEntryDto[]` | `HealthCard` |
| `HealthCheckEntryDto` | `name`, `status`, `durationMs` | `HealthCard` check list |
| `ProblemDetails` / `HttpValidationProblemDetails` | `type, title, status, detail, instance, traceId, errors?` | `ApiError`, toasts, form errors |

## Client types (hand-written, not API shapes)

| Type | Fields | Notes |
|---|---|---|
| `ApiError` (class) | `status: number`, `problem: ProblemDetails` | thrown by `apiFetch` for non-accepted statuses; network failures use `status: 0` |
| `HealthView` (derived) | `kind: "healthy" \| "unhealthy" \| "unreachable"`, `report?`, `error?` | computed in `HealthCard` from query state |

No client stores in Phase 0 (auth store arrives in Phase 1).
