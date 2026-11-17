# Feature Specification: Foundation & Architecture (Web app)

**Feature Branch**: `001-project-foundation-and-health-check`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Phase 0 – Foundation & Architecture. Scaffold the single-page web app with no business features: application shell and navigation placeholders, shared UI building blocks, a central API client, automated checks on pull requests, one-command local startup next to the API, and the documentation skeleton. Proof of life: the app shows the API health status."

## Clarifications

### Session 2026-11-17

- Q: What does the health status contain? → A: Overall status, a separate database check result and the check time (from the API contract); the card shows all three.
- Q: Does the health card refresh by itself? → A: Yes, every 30 seconds while the tab is visible, plus a manual Retry action.
- Q: Which local addresses are used? → A: Web app at `localhost:8081` (container) or the dev server's default port (no container), API at `localhost:8080`; API calls always use the same-origin `/api` path.
- Q: Where does the health status live once real screens exist? → A: Phase 0: card on the home page. From Phase 3: home goes to the Track List and health becomes a compact status indicator in the header.
- Q: Language and text direction? → A: Interface in English (left-to-right); user-entered text (titles, names) renders in its own direction so Arabic script reads correctly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See that the system is alive (Priority: P1)

A reviewer opens the web app and immediately sees whether the API is reachable and healthy. While
the status is loading they see a placeholder shaped like the status card; if the API is down they
see a clear error with a way to retry.

**Why this priority**: This is the Phase 0 proof of life connecting both repositories; it also
exercises the API client, loading, error and success states that every later screen reuses.

**Independent Test**: With the API running, open the app and see "healthy"; stop the API, retry,
and see the unavailable state; start it again, retry, and see "healthy".

**Acceptance Scenarios**:

1. **Given** the API is healthy, **When** the reviewer opens the app, **Then** a status indicator
   shows the API as healthy along with when it was last checked.
2. **Given** the status is still loading, **When** the page renders, **Then** a content-shaped
   loading placeholder is shown (no spinner as the primary loader).
3. **Given** the API is unreachable or unhealthy, **When** the check completes, **Then** an error
   state explains the API is unavailable and offers a retry action.

---

### User Story 2 - Start the web app locally with one command (Priority: P1)

After the API stack is running, a reviewer starts the web app from its own repository with one
documented command and opens it in the browser; all API calls are routed through the same origin.

**Why this priority**: Reviewers must be able to run the full system locally.

**Independent Test**: Start the API stack, then run the web app's start command and open the
documented URL; the health status shows healthy.

**Acceptance Scenarios**:

1. **Given** the API stack is running, **When** the reviewer runs the documented start command,
   **Then** the app is served at the documented local URL and reaches the API through the same origin.
2. **Given** a deep link (e.g. a future detail page URL), **When** the browser refreshes on it,
   **Then** the app still loads (no "not found" from the server).
3. **Given** a developer workflow without containers, **When** the developer runs the dev server,
   **Then** API calls are forwarded to the locally running API.

---

### User Story 3 - Pull requests are checked automatically (Priority: P1)

Every pull request to main automatically runs lint, type checks, tests and a production build and
reports the result on the pull request.

**Why this priority**: Evidence of quality for each phase; required by the assignment's process.

**Independent Test**: Open a pull request with a deliberate type error; the check fails. Fix it; it passes.

**Acceptance Scenarios**:

1. **Given** a pull request to main, **When** it is opened or updated, **Then** lint, type check,
   tests and build run and report pass/fail.

---

### User Story 4 - Navigate a consistent app shell (Priority: P2)

The reviewer sees a consistent layout with the product name and navigation entries for the
upcoming areas (Tracks, Artists), and an unknown URL shows a friendly "page not found" view with a
link back home.

**Why this priority**: Gives later phases a place to plug screens into; low risk, low effort.

**Independent Test**: Open the app, see the shell; open an unknown URL, see the not-found view.

**Acceptance Scenarios**:

1. **Given** any page, **When** it renders, **Then** the shared header/navigation is visible and
   usable by keyboard.
2. **Given** an unknown URL, **When** it is opened, **Then** a not-found view with a link home is shown.

---

### Edge Cases

- The API responds with the standard problem format: the app shows its title/detail in a
  notification rather than a raw error.
- The API is slow: the loading placeholder stays visible; no layout jump when data arrives.
- Narrow (phone-width) screens: the shell and status card remain usable without horizontal scrolling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display the API health status (overall status, database check result,
  last-checked time) with loading, healthy, unhealthy/unreachable and retry states. It MUST re-check
  automatically every 30 seconds while the tab is visible. In Phase 0 the status card is the home
  page; from Phase 3 it moves to a compact header indicator.
- **FR-010**: The interface MUST be in English (left-to-right) while user-entered text renders in its
  own direction so Arabic-script titles and names display correctly.
- **FR-011**: Locally, the containerised app MUST be served at `localhost:8081`; the dev server uses
  its default port; both reach the API through the same-origin `/api` path.
- **FR-002**: All API calls MUST go through one central client using a same-origin base path, able
  to attach an access token (used from Phase 1) and translate standard problem responses into
  user-facing notifications or field errors.
- **FR-003**: The app MUST provide an app shell with navigation placeholders for Tracks and Artists
  and a not-found view.
- **FR-004**: Loading states MUST use content-shaped placeholders; every data view MUST have empty
  and error states (the health card has no empty state).
- **FR-005**: The repository MUST start the app with one documented command that joins the shared
  local network of the API stack and forwards API calls to it; deep links MUST survive refresh.
- **FR-006**: Every pull request to main MUST run lint, type check, tests and production build.
- **FR-007**: The repository MUST pin its runtime version and commit its dependency lockfile.
- **FR-008**: The repository MUST contain a README skeleton (prerequisites, run with/without
  containers, tests, CI) linking to the API repository and its decisions document.
- **FR-009**: The app MUST contain no secrets; public configuration only, with an example environment file.

### Key Entities

- **Health status**: whether the API is healthy, plus the time it was last checked. Read-only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the API stack running, a reviewer sees the health status within 5 seconds of
  opening the app.
- **SC-002**: A reviewer gets the web app running in at most 3 commands from a fresh clone.
- **SC-003**: 100% of pull requests to main show an automated lint/type/test/build result.
- **SC-004**: The health card and shell are usable at 360px width with no horizontal scrolling.

## Assumptions

- The API repository's stack is started first and provides the shared local network.
- Login, protected routes and business screens are out of scope for Phase 0 (Phases 1–4).
- The API health status response shape comes from the API repository's exported contract.
