# Feature Specification: Security Hardening, Documentation and End-to-End Check (web app)

**Feature Branch**: `006-seed-data-security-hardening-and-docs`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Phase 5 – Seed data, security hardening and documentation. Security review of both repos (findings table with severity, fix, evidence): security headers in the nginx image, dependency vulnerabilities (npm audit), Docker image hardening, secrets in git history, error messages, token handling; no claim without evidence. Finished README (quick start with and without Docker, configuration, tests, CI and branch protection note, API overview, structure, links to the backend repo and its DECISIONS.md). End-to-end check in a real browser against the full compose stack with the seed data: sign in, browse with filters, detail, add artist and track, distribute, change delivery statuses, sign out. Clean-clone build and test, CI green, complete .env.example, no dead code or files."

## Clarifications

### Session 2026-11-17 (recommended defaults – pending the user's OK)

- Q1, Q2, Q5: (API – see the backend spec) when sample data is added, extra rate limits, the
  DECISIONS.md example.
- Q3: `npm audit` reports 21 findings (13 high, 8 moderate), all in development tools (build, lint,
  test); the packages shipped to browsers have none. → A: (a) remove the unused `shadcn` command-line
  tool (the components are written by hand because it injects an unrelated package; it causes 9 of
  the findings); (b) move the remaining `minimatch` copies to a fixed version that is at least two
  weeks old, if lint, tests and build still pass; (c) `picomatch` has no fixed version at all (the
  newest release is the affected one): accept it, documented, because it only runs on the project's
  own file patterns at build time.
- Q4: The font (Readex Pro) is loaded from Google's servers, which tells Google every visitor's
  address and forces two extra hosts into the content policy. → A: Serve the font files from the
  web app itself (Readex Pro is under the SIL Open Font License; files only, no package) and remove
  Google from the content policy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The web app resists common attacks (Priority: P1)

**Why this priority**: The assignment asks for a security review of both repos.

**Independent Test**: Run each check in the findings table; each row names its evidence.

**Acceptance Scenarios**:

1. **Given** any page or asset from the web container, **Then** it carries the security headers
   (content policy without third-party hosts, no framing, no sniffing, referrer policy, permissions
   policy), checked against the running container.
2. **Given** `npm audit` for the shipped packages, **Then** 0 findings; for development tools, every
   remaining finding is listed with the reason it is accepted.
3. **Given** the web image, **Then** it runs as a non-root user, contains only the built files and the
   server config, and no `.env` or source.
4. **Given** user-typed text (names, titles), **Then** it is only ever rendered as text.
5. **Given** an API error, **Then** the page shows the API's safe message, never raw response bodies
   or stack traces.

---

### User Story 2 - An evaluator can run and understand the web app (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the README, **Then** it follows the README rule (what, stack, quick start with and without
   Docker, configuration, tests, CI and branch protection, pages and API calls, structure, links to the
   backend repo, the walkthrough and the backend's DECISIONS.md) and every link resolves.
2. **Given** the README, **Then** it says the catalogue shown on first start is sample data from the API.

---

### User Story 3 - The whole product works end to end (Priority: P1)

**Independent Test**: A real browser against both compose stacks with the sample data.

**Acceptance Scenarios**:

1. **Given** the full stack, **When** a visitor browses the catalogue with each filter and opens a
   track, **Then** results match the sample data.
2. **Given** the admin signs in, **When** they add an artist and a track, submit it, distribute it,
   mark one delivery live and one rejected, send the rejected one again and sign out, **Then** every
   step works; anything that fails is reported.
3. **Given** desktop and 400 px widths, light and dark, **Then** no horizontal overflow and no app
   console errors.

---

### User Story 4 - The submission works from a clean clone (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a fresh clone, **When** `npm ci`, lint, typecheck, tests and build run, **Then** they pass.
2. **Given** the repo, **Then** there is no unused package, debug code or dead file.

### Edge Cases

- Fonts served locally fail to load → the system font stack still renders Arabic and Latin text.
- The development-tool fix (minimatch) breaks lint or tests → keep the current version and list the
  finding as accepted, with the reason.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The web container MUST send security headers on every response, with a content policy
  that allows only the app's own origin.
- **FR-002**: Shipped packages MUST have 0 known vulnerabilities; development-tool findings MUST be fixed
  or listed with a reason in the findings table (backend repo, covering both).
- **FR-003**: The font MUST be served by the web app itself; no request may go to a third-party host.
- **FR-004**: The unused `shadcn` command-line package MUST be removed.
- **FR-005**: The README MUST be finished per the README rule with no broken links.
- **FR-006**: The end-to-end check MUST be run and its result recorded in the walkthrough and AI log.
- **FR-007**: A clean clone MUST pass `npm ci`, lint, typecheck, tests and build; CI MUST be green.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm audit --omit=dev` reports 0 findings; development findings drop from 21 and every
  remaining one is explained.
- **SC-002**: The running container's headers match the documented policy; a browser loading any page
  makes requests only to its own origin.
- **SC-003**: Every end-to-end step passes in Edge at desktop and 400 px, light and dark.
- **SC-004**: 0 broken links in the README.

## Assumptions

- The security findings table and DECISIONS.md live in the backend repo (agreed layout) and cover both.
- The token stays in `localStorage` (Phase 1 decision, trade-off documented); moving it to a cookie
  is out of scope.
