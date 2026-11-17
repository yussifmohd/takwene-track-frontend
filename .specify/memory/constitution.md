<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0 (MINOR: README rule added to Development Workflow & Quality Gates)
- Added: README describes the finished product (fixed structure, no phase history, accurate to the
  code, updated only where the product changed) (user, Phase 4)
- Templates: no edit needed (README tasks reference the rule in tasks.md per phase)
- Previous amendment, 1.0.0 → 1.1.0 (MINOR: Definition of Done materially expanded)
- Modified section: Development Workflow & Quality Gates – every phase PR must update
  docs/walkthrough.md and Memory.md; the Definition of Done is not met without both (user, Phase 2)
- Principles: unchanged
- Templates: ✅ .specify/templates/tasks-template.md (Polish phase lists walkthrough + Memory tasks)
             ✅ plan-template.md, spec-template.md (no edit needed)
- Deferred TODOs: none
- Previous: 1.0.0 initial ratification (Phase 0)
-->

# Takwene Track Management Web Constitution

## Core Principles

### I. Contract-First Integration

- The backend repo's OpenAPI contract (`backend/specs/<feature>/contracts/`) is the source of
  truth. API types are generated from it (or mirror it exactly); hand-written response shapes
  that diverge from the contract are forbidden.
- All HTTP goes through one typed API client with a JWT interceptor. The base URL is `/api`
  (Vite dev proxy locally, nginx proxy in Docker, ALB path routing on AWS).
- ProblemDetails responses are mapped centrally: field errors to form fields, everything else to toasts.

### II. Clear State Ownership

- Server state lives only in TanStack Query (queries, mutations, cache invalidation).
- Client/UI/auth state lives only in zustand stores. Server data is never copied into zustand.
- Filters that define what the user is looking at (e.g. track status) are synced to the URL.

### III. Every State Is Designed

- Every data view has loading, empty, error and success states. Loading uses shadcn `Skeleton`
  shaped like the content; spinners are never the primary loader.
- UI is built with shadcn/ui + Tailwind, accessible (labels, focus, keyboard), responsive down to
  phone width, and follows the frontend-design skill for every screen.
- Forms use react-hook-form + zod with inline field errors and disabled/pending submit states.

### IV. Tests Ship With Features (NON-NEGOTIABLE)

- Each phase adds Vitest + React Testing Library tests for its key components, hooks and stores in
  the same branch. Lint, typecheck, tests and build MUST pass locally and in CI before a PR.

### V. Security-Aware Client

- The access token is stored in a persisted zustand store (localStorage); the XSS tradeoff is
  documented. Logout happens on token expiry or any 401, and protected routes guard write screens.
- No secrets in the bundle or the repo; only `VITE_*` public config, with `.env.example` placeholders.
- Never render untrusted HTML (`dangerouslySetInnerHTML` is forbidden).

### VI. Spec-Driven, Traceable Delivery

- Every phase follows Spec Kit: specify (WHAT/WHY, no stack) → clarify → plan (HOW, reads the
  backend contract) → tasks → analyze → implement. No production code before spec, plan and tasks.
- One branch per phase from an up-to-date main, Conventional Commits, no commits to main, no squash,
  no force-push. A human merges; the backend PR of a phase is merged first.

### VII. Simplicity & License Hygiene

- Build only what the phase needs. Every npm dependency's license is checked before it is added;
  commercial or source-available packages are forbidden. Versions are pinned through the committed
  lockfile, Node is pinned via `.nvmrc` and `engines`, and pinned versions are recorded in Memory.md.

## Technology Stack & Constraints

- React + TypeScript (strict) + Vite, React Router.
- zustand (client/auth state), TanStack React Query (server state).
- shadcn/ui (current CLI) + Tailwind CSS, shadcn Skeleton for loading, toasts for errors.
- react-hook-form + zod.
- Vitest + React Testing Library; ESLint; `tsc --noEmit` typecheck.
- Docker: multi-stage build served by nginx (SPA fallback, `/api` proxy to `http://api:8080`),
  own `docker-compose.yml` running `web` on the external network `trackmgmt-net`.
- CI: `.github/workflows/frontend-ci.yml` on pull_request to main (install, lint, typecheck, test, build).

## Development Workflow & Quality Gates

Definition of Done per phase: lint, typecheck, tests and build pass; CI green; `docker compose up`
still works against the backend stack; spec, plan and tasks committed; repo Memory.md and
`docs/walkthrough.md` updated;
PR opened with summary, test evidence and checklist; README kept current and linking to the
backend repo's DECISIONS.md.
Every phase PR MUST update `docs/walkthrough.md` (a section for that phase: what was built, key
files, one end-to-end flow page → query hook → API client, decisions, how to run/test,
limitations; describing only what is in the code) and Memory.md; without both, the Definition of
Done is not met.

README rule (user, Phase 4): each repo's README describes the **finished product** for someone who
clones the repo, not the history of the phases. Structure: what the project is; tech stack; quick
start (Docker and without Docker); configuration and environment variables; how to run migrations;
how to obtain a JWT; how to run tests; API overview (a short endpoint table); project structure; link
to the other repo; links to `docs/walkthrough.md` and `DECISIONS.md`. The README MUST NOT mention phase
numbers, "coming soon" or per-phase changelogs (those belong in `docs/walkthrough.md` and
`docs/ai-log.md`), MUST stay accurate to what exists in the code today, and is updated in a PR only
where the product changed.

## Governance

This constitution supersedes other practices in this repo. Amendments require the user's
approval, a semantic version bump and an updated Sync Impact Report. Every plan's Constitution
Check and every PR review verify compliance; violations must be justified in Complexity Tracking.
Runtime guidance: `CLAUDE.md` and `Memory.md`.

**Version**: 1.2.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
