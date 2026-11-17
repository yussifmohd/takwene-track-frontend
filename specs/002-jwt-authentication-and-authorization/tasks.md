---
description: "Task list for Phase 1 – Admin Sign-in & Session (Web app)"
---

# Tasks: Admin Sign-in & Session (Web app)

**Input**: Design documents from `specs/002-jwt-authentication-and-authorization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md, quickstart.md;
backend contract `../backend/specs/002-jwt-authentication-and-authorization/contracts/openapi.json`
**Tests**: REQUIRED by the constitution (Principle IV).
**Skills**: react-frontend-stack (all code), frontend-design (T016, T024), git-workflow, decisions-log

## Format: `[ID] [P?] [Story] Description` — paths relative to the frontend repo root.

---

## Phase 1: Setup & housekeeping

- [x] T001 [P] Upgrade `.github/workflows/frontend-ci.yml` to `actions/checkout@v7`, `actions/setup-node@v7` (research R7)
- [x] T002 Point `gen:api` at the backend 002 contract and regenerate `src/api/schema.d.ts` (needs backend T027)
- [x] T003 `npx shadcn@4.23.0 add input label`; review `package.json` (no new deps expected) and fix any `cn` import rewrites

---

## Phase 2: Foundational

- [x] T004 [P] Tests `src/stores/authStore.test.ts`: signIn persists to `trackmgmt.session`; signOut clears storage and records reason; rehydrate drops expired, malformed and wrong-version data; `isAuthenticated` false at/after expiry
- [x] T005 `src/stores/authStore.ts` (zustand persist, zod-validated rehydrate, selectors `useIsAuthenticated`, `useSession`)
- [x] T006 [P] Tests `src/api/client.test.ts` additions: `retryAfterSeconds` parsed from `Retry-After`; `skipAuthHandling` suppresses `onUnauthorized`; expired session token not attached
- [x] T007 `src/api/problem.ts` (`ApiError.retryAfterSeconds`), `src/api/client.ts` (`skipAuthHandling`), `src/lib/authSetup.ts` (client ↔ store wiring, `storage` event → rehydrate), call from `src/main.tsx`
- [x] T008 [P] `src/api/auth.ts` (`login(body)` with `skipAuthHandling`, `getCurrentUser(signal)`) typed from the generated schema
- [x] T009 [P] `src/features/auth/redirect.ts` + `redirect.test.ts` (accepts `/account?x=1`; rejects `//evil`, `/\evil`, `https://…`, `javascript:`, `/login…`, empty → `/`)

**Checkpoint**: store + client wiring tested.

---

## Phase 3: User Story 1 – Admin signs in (P1) 🎯 MVP

### Tests
- [x] T010 [P] [US1] `src/features/auth/pages/LoginPage.test.tsx` (MSW): field errors without request; success stores session and navigates to the safe redirect; 401 → generic alert, password cleared + focused, email kept; 400 → field errors from ProblemDetails; 429 → wait message with seconds; network error → unreachable message; submitting disables button; signed-in visitor → redirected to `/`; keyboard-only: tab to fields, type, Enter submits (A6)

### Implementation
- [x] T011 [US1] `src/features/auth/schemas.ts` (zod login schema), `hooks/useLoginMutation.ts`
- [x] T012 [US1] `src/features/auth/pages/LoginPage.tsx` (react-hook-form + zodResolver, labelled fields, `autoComplete`, `aria-invalid`/`aria-describedby`, `role="alert"` for form errors, focus first invalid field)
- [x] T013 [US1] Route `/login` in `src/router.tsx`

---

## Phase 4: User Story 3 – Protected pages require sign-in (P1)

### Tests
- [x] T014 [P] [US3] `src/features/auth/components/RequireAuth.test.tsx` (signed out → `/login?redirect=%2Faccount`; after sign-in back on `/account`; status page never redirects) and `src/features/auth/pages/AccountPage.test.tsx` (skeleton, data with email/role/session end, error + Retry)

### Implementation
- [x] T015 [US3] `src/features/auth/components/RequireAuth.tsx` (layout route, `handle.requiresAuth`), `hooks/useCurrentUserQuery.ts`, `pages/AccountPage.tsx`; route `/account` under the guard
- [x] T016 [US3] Apply frontend-design to LoginPage and AccountPage (tokens from Phase 0, 360 px, keyboard focus, dark mode)

---

## Phase 5: User Story 2 – Session survives reloads and ends cleanly (P1)

### Tests
- [x] T017 [P] [US2] `src/features/auth/components/AuthMenu.test.tsx` (signed out → "Sign in" link with return address; signed in → email + "Sign out"; sign-out on `/account` → `/` + "Signed out" toast; on `/` stays)
- [x] T018 [P] [US2] `src/features/auth/components/SessionWatcher.test.tsx` (fake timers: expiry → signed out + "session expired" toast; on protected page → login with redirect; any 401 from the API → signed out + "no longer valid" toast; `["auth"]` queries removed; another tab signing out (`storage` event) signs this tab out; window focus with an expired session signs out (A5))

### Implementation
- [x] T019 [US2] `src/features/auth/components/AuthMenu.tsx`, `SessionWatcher.tsx` (expiry timer, focus check, cross-tab via `storage` event), `hooks/useSessionExpiry.ts`; mount in `AppShell` (+ "My account" nav item when signed in); update `AppShell.test.tsx`

---

## Phase 6: Polish & cross-cutting

- [x] T020 [P] README: sign-in, session storage trade-off, protected routes
- [x] T021 [P] Repo `Memory.md` (state, conventions: auth store, RequireAuth, skipAuthHandling)
- [x] T022 Full local check: lint, typecheck, tests, build, bundle budget, `docker compose up --build` against the backend stack, quickstart.md steps 1–9 (time sign-in for SC-001, A7), secret scan
- [x] T023 Screenshots (desktop light/dark, 360 px via iframe) of login and account pages; fix issues
- [ ] T024 Mark tasks [X]; push; open PR referencing the backend PR (after it is opened); CI green without Node 20 annotation

---

## Dependencies & Execution Order

- Backend T027 (contract) → T002 → everything typed from the schema.
- Setup → Foundational → US1 → US3 → US2 (US2's redirect behaviour uses RequireAuth) → Polish.
- Within each story: tests first, then implementation.

## Parallel Example

```text
T004 store tests | T006 client tests | T009 redirect helper        (after T003)
T014 guard/account tests | T017 menu tests | T018 watcher tests    (after T013)
```

## Implementation Strategy

MVP = Setup + Foundational + US1 (working sign-in). Then US3 (guard + account), US2 (header,
expiry, 401). Small Conventional Commits per task group.
