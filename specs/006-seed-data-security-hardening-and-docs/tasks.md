---
description: "Task list for Phase 5 – Security Hardening, Documentation and End-to-End Check (web app)"
---

# Tasks: Security Hardening, Documentation and End-to-End Check (web app)

**Input**: Design documents from `specs/006-seed-data-security-hardening-and-docs/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md
**Tests**: REQUIRED by the constitution (existing suite stays green; evidence for headers and E2E).
**Skills**: react-frontend-stack, frontend-design, git-workflow, decisions-log

## Format: `[ID] [P?] [Story] Description` — paths relative to the frontend repo root.

---

## Phase 1: User Story 1 – Security (P1)

- [x] T001 [US1] Remove `shadcn` devDependency and `components.json`; `npm audit` before/after recorded
- [x] T002 [US1] Try `overrides` pinning eslint's `minimatch` to 11.0.4 (license BlueOak-1.0.0); keep only if lint, typecheck, tests, build pass; else revert and record as accepted
- [x] T003 [US1] Self-host Readex Pro (OFL-1.1 files + `OFL.txt` license file in `public/fonts/`), `@font-face` in `src/index.css`, remove Google links from `index.html`; real-browser network log proves no request to Google (Q4)
- [x] T004 [US1] `nginx/security-headers.conf` snippet; include in `/` and `/assets/`; `/api/` without nginx copies; CSP without Google hosts + `object-src 'none'`; COOP; Dockerfile copies the snippet
- [x] T005 [US1] Evidence: `curl -sI` on the running container (quickstart 2), network log (quickstart 3), Trivy on `trackmgmt-web:local`, `.dockerignore` check → rows for the backend's `docs/security-review.md`
- [x] T006 [P] [US1] Check user text is rendered only as text (lint rule + grep) and API errors show only ProblemDetails `title`/`detail` (existing tests) → evidence rows

## Phase 2: User Story 2 – Documentation (P1)

- [x] T007 [US2] README finished per README rule (sample data note, CI + branch protection, font served locally, links to backend repo, walkthrough and the backend's DECISIONS.md and security review); link check

## Phase 3: User Story 3 – End to end (P1)

- [x] T008 [US3] E2E run (quickstart 5) on both compose stacks with the sample data; failures fixed or reported

## Phase 4: User Story 4 – Delivery (P2)

- [x] T009 [US4] Dead code/files check (grep `console.`/`debugger`/TODO, unused files); clean clone build + tests in a new scratch folder
- [x] T010 Polish: walkthrough Phase 5 section, Memory.md, ai-log Phase 5 frontend section on the backend branch, submission checklist in master Memory.md filled in (A5), tick tasks, PR after the backend PR; CI green

## Dependencies

- T001 → T002. T003 → T004 → T005. T007 after T001–T006. T008 after the backend PR's seeder is available. T010 last.
