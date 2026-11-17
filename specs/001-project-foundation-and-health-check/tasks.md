---
description: "Task list for Phase 0 – Foundation & Architecture (Web app)"
---

# Tasks: Foundation & Architecture (Web app)

**Input**: Design documents from `specs/001-project-foundation-and-health-check/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md, quickstart.md;
backend contract `../backend/specs/001-project-foundation-and-health-check/contracts/openapi.json`
**Tests**: REQUIRED by the constitution (Principle IV).
**Skills**: react-frontend-stack (all code), frontend-design (T019, T024), git-workflow, decisions-log

## Format: `[ID] [P?] [Story] Description` — paths relative to the frontend repo root.

---

## Phase 1: Setup

- [ ] T001 `.gitattributes`, `.gitignore` (node_modules, dist, coverage, `.env`), `.nvmrc` (26.13.1)
- [ ] T002 `package.json` (name, private, type module, engines `>=26.13.1 <27`, scripts: dev, build, preview, lint, typecheck, test, gen:api) and install exact pins from research.md R2 with `npm i -E`; commit `package-lock.json`
- [ ] T003 [P] `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` (strict, `@/*` alias), `vite.config.ts` (react + tailwind plugins, alias, dev proxy `/api` → `http://localhost:8080`, port 5173), `index.html`
- [ ] T004 [P] `eslint.config.js` (flat: @eslint/js, typescript-eslint, react-hooks) and `vitest.config.ts` (jsdom, setup file, css)
- [ ] T005 Tailwind 4 `src/index.css` + `npx shadcn@4.23.0 init` (`components.json`, `src/lib/utils.ts`), then `shadcn add button card badge skeleton sonner separator`
- [ ] T006 Verify `npm run lint && npm run typecheck && npm run build` pass on the empty app

---

## Phase 2: Foundational

- [ ] T007 `npm run gen:api` → `src/api/schema.d.ts` from the backend Phase 0 contract (header comment with source path)
- [ ] T008 `src/api/problem.ts` (ProblemDetails type re-export, `ApiError` class, `parseProblem`, `getFieldErrors`) and `src/api/client.ts` (`apiFetch` with base URL, JSON, `acceptStatuses`, token provider + onUnauthorized hooks, network error → `ApiError(0)`) and `src/api/toast.ts` `showProblemToast(error)` (ProblemDetails title/detail → sonner toast; analyze C1)
- [ ] T009 [P] Tests `src/api/client.test.ts` (problem+json parsed into ApiError; non-JSON error synthesised; accepted 503 returns body; bearer header added when provider returns token; network failure → status 0)
- [ ] T010 `src/lib/queryClient.ts`, `src/main.tsx` (QueryClientProvider, RouterProvider, Toaster), `src/router.tsx`
- [ ] T011 [P] Test utilities `src/test/setup.ts` (jest-dom, MSW server lifecycle), `src/test/server.ts`, `src/test/render.tsx` (`renderWithProviders`)
- [ ] T012 [P] Shared states `src/components/ErrorState.tsx` (title, detail, Retry) and `src/components/PageHeader.tsx`; `src/lib/format.ts` (time formatting), and `src/components/UserText.tsx` (renders user-entered text with `dir="auto"`, FR-010, analyze E2) with a test in `src/components/UserText.test.tsx`

**Checkpoint**: client + providers ready, tests green.

---

## Phase 3: User Story 1 – See that the system is alive (P1) 🎯 MVP

**Goal**: health card with skeleton, healthy, unhealthy, unreachable + retry, 30 s refresh.
**Independent Test**: quickstart.md "US1".

### Tests for User Story 1

- [ ] T013 [P] [US1] `src/features/health/components/HealthCard.test.tsx`: shows Skeleton while loading; healthy report renders status, database check and last-checked time; 503 body renders Unhealthy with failing check; network error renders ErrorState and Retry refetches to healthy
- [ ] T014 [P] [US1] `src/features/health/hooks/useHealthQuery.test.ts`: refetch interval 30 s and disabled in background (query options asserted)

### Implementation for User Story 1

- [ ] T015 [US1] `src/api/health.ts` (`getHealth(signal)` using `acceptStatuses: [503]`, typed with generated `HealthReportDto`)
- [ ] T016 [US1] `src/features/health/hooks/useHealthQuery.ts`
- [ ] T017 [US1] `src/features/health/components/HealthCard.tsx` (Skeleton matching final layout; status badge; check list; last checked; Retry; `aria-live="polite"` for status changes)
- [ ] T018 [US1] `src/pages/HomePage.tsx` composing PageHeader + HealthCard
- [ ] T019 [US1] Apply frontend-design skill to HomePage/HealthCard (typography, color tokens in `index.css`, light/dark via `prefers-color-scheme`, 360 px check)

---

## Phase 4: User Story 2 – Start the web app locally with one command (P1)

- [ ] T020 [US2] `nginx/default.conf.template` (listen 8081; SPA fallback; `/api/` → `${API_UPSTREAM}` with resolver 127.0.0.11 and variable upstream; cache headers; security headers)
- [ ] T021 [US2] `Dockerfile` (node:26.13.1-alpine build with `npm ci`, nginxinc/nginx-unprivileged:1.30.6-alpine runtime, `API_UPSTREAM=http://api:8080` default, EXPOSE 8081, HEALTHCHECK) and `.dockerignore`
- [ ] T022 [US2] `docker-compose.yml` (service `web`, `8081:8081`, network `trackmgmt-net` external) and `.env.example` (`VITE_API_BASE_URL=/api`)
- [ ] T023 [US2] Run quickstart US2 against the running backend stack (healthy card at :8081, deep link refresh works, dev server proxy works); record evidence

---

## Phase 5: User Story 4 – Navigate a consistent app shell (P2)

### Tests for User Story 4

- [ ] T024 [P] [US4] `src/components/AppShell.test.tsx` (header + nav landmarks, Tracks/Artists marked coming soon) and `src/router.test.tsx` (unknown path renders Not found with link home)

### Implementation for User Story 4

- [ ] T025 [US4] `src/components/AppShell.tsx` (header, nav, `<Outlet/>`, skip link) and `src/components/NotFoundPage.tsx`; wire into `src/router.tsx` (apply frontend-design)

---

## Phase 6: User Story 3 – Pull requests are checked automatically (P1)

- [ ] T026 [US3] `.github/workflows/frontend-ci.yml` (pull_request → main; setup-node from .nvmrc with npm cache; `npm ci`; lint; typecheck; `npm test -- --run`; build)

---

## Phase 7: Polish & Cross-Cutting

- [ ] T027 [P] `README.md` skeleton: overview, links (backend repo, backend DECISIONS.md), prerequisites, run with Docker (after backend) / without Docker, regenerate API types, tests, CI, structure
- [ ] T028 [P] Repo-local `Memory.md` (conventions, pinned versions, state, next action) and `CLAUDE.md` (imports Memory.md, keeps SPECKIT block)
- [ ] T029 Full local check (lint, typecheck, tests, build, docker compose up), secret scan, and bundle-size check: initial JS < 250 kB gzip from the `vite build` report (plan performance goal; analyze E3)
- [ ] T030 Push branch and open PR with `gh pr create` referencing the backend PR — after the backend PR is opened

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 (needs built app) ; US4 and US3 only need Foundational. Polish last.
- Backend dependency: T007 needs the backend contract (exists); T023 needs the backend stack running.

## Parallel Example: Foundational

```text
T009 client tests | T011 test utilities | T012 shared states   (after T008 / T010)
```

## Implementation Strategy

MVP = Setup + Foundational + US1 (health card proven with MSW), then US2 (real stack in Docker),
US4 (shell), US3 (CI). Commit per task group with descriptive Conventional Commits.
