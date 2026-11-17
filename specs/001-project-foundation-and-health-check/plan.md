# Implementation Plan: Foundation & Architecture (Web app)

**Branch**: `001-project-foundation-and-health-check` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-project-foundation-and-health-check/spec.md`

**Backend contract**: `../backend/specs/001-project-foundation-and-health-check/contracts/openapi.json`

**Skills applied**: react-frontend-stack, frontend-design, git-workflow, decisions-log

## Summary

Scaffold the React 19 + TypeScript + Vite SPA with Tailwind 4 and shadcn/ui, TanStack Query,
React Router, a typed fetch client generated from the backend contract with ProblemDetails
handling, an app shell with placeholder navigation and a not-found page, and the Phase 0 proof of
life: a health status card (Skeleton loading, healthy/unhealthy/unreachable states, 30 s
auto-refresh, Retry). Add Vitest/RTL/MSW tests, ESLint + typecheck, a PR CI workflow, a non-root
nginx Docker image on port 8081 joining `trackmgmt-net`, and the docs skeleton.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict), Node 26.13.1

**Primary Dependencies**: React 19.3.1, react-router 8.5.1, @tanstack/react-query 5.105.3,
Tailwind 4.3.4 + shadcn CLI 4.23.0, sonner 2.0.8, lucide-react; zustand / react-hook-form / zod
installed now, used from Phase 1 (full table: research.md R2)

**Storage**: N/A (server state via API; localStorage for auth from Phase 1)

**Testing**: Vitest 5.1.0 + jsdom 30.1.3, React Testing Library 16.3.3, user-event, jest-dom, MSW 3.0.3

**Target Platform**: modern evergreen browsers; served by nginx (container) or Vite dev server

**Project Type**: web-app (SPA) — API in separate repo

**Performance Goals**: health visible < 5 s after load (SC-001); initial JS bundle < 250 kB gzip

**Constraints**: Skeleton for loading; same-origin `/api`; no secrets; usable at 360 px; LTR UI with `dir="auto"` user text

**Scale/Scope**: 2 routes in Phase 0 (home, not found); ~10 screens by Phase 4

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Contract-first | Types generated from backend contract; single client; `/api` base; ProblemDetails mapping | ✅ |
| II. State ownership | Health in TanStack Query; no server data in zustand; (filters in URL from Phase 3) | ✅ |
| III. Every state designed | Skeleton, error + retry, success; responsive; frontend-design skill | ✅ (no empty state for health – single object) |
| IV. Tests ship with features | HealthCard states, client, routing tests; CI lint/type/test/build | ✅ |
| V. Security-aware client | No secrets; only `VITE_API_BASE_URL`; no `dangerouslySetInnerHTML`; security headers in nginx | ✅ |
| VI. Spec-driven delivery | spec/plan/tasks before code | ✅ |
| VII. Simplicity & licenses | All deps MIT/Apache/ISC, exact pins, lockfile, Node pinned | ✅ |

Post-design re-check: ✅ no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-foundation-and-health-check/
├── spec.md  plan.md  research.md  data-model.md  quickstart.md
├── contracts/README.md      # points to the backend contract + UI route contract
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── .nvmrc  package.json  package-lock.json  tsconfig*.json  vite.config.ts  vitest.config.ts
├── eslint.config.js  components.json  index.html  .env.example
├── .gitattributes  .gitignore  .dockerignore  Dockerfile  nginx/default.conf.template  docker-compose.yml
├── .github/workflows/frontend-ci.yml
├── README.md  Memory.md  CLAUDE.md
└── src/
    ├── main.tsx  App.tsx  router.tsx  index.css
    ├── api/ client.ts  problem.ts  schema.d.ts (generated)  health.ts
    ├── features/health/ components/HealthCard.tsx  hooks/useHealthQuery.ts
    ├── components/ AppShell.tsx  ErrorState.tsx  NotFoundPage.tsx  PageHeader.tsx
    ├── components/ui/ (shadcn: button, card, badge, skeleton, sonner, separator)
    ├── pages/ HomePage.tsx
    ├── lib/ utils.ts  queryClient.ts  format.ts
    └── test/ setup.ts  server.ts  render.tsx
       (tests co-located: *.test.tsx next to the unit under test)
```

**Structure Decision**: single SPA repo, feature folders under `src/features/<feature>`, shared UI in
`src/components`, generated shadcn primitives in `src/components/ui`.

## Key design decisions (details in research.md)

1. `apiFetch` with `acceptStatuses` so the 503 health body is data, not an error.
2. `useHealthQuery`: 30 s `refetchInterval`, paused in background tabs, `retry: 1`.
3. Generated `schema.d.ts` committed; `gen:api` script reads the backend repo's contract.
4. nginx variable upstream + Docker resolver → web starts even if API is down; `/api` proxied only in Docker.
5. Tests co-located; MSW for all HTTP in tests.

## Complexity Tracking

None.
