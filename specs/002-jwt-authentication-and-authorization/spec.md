# Feature Specification: Admin Sign-in & Session (Web app)

**Feature Branch**: `002-jwt-authentication-and-authorization`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Phase 1 – JWT authentication and authorization (web app). A sign-in page for the admin, the session kept across reloads, protected pages that send visitors to sign-in first, sign-out, and automatic sign-out when the API reports the session is no longer valid. Reading stays public; there is no registration."

**Depends on**: API Phase 1 (`../backend/specs/002-jwt-authentication-and-authorization/`).

## Clarifications

### Session 2026-11-17 (recommended defaults applied; pending user confirmation at the analyze checkpoint)

- Q: Which page is protected in Phase 1? → A: "My account" (email, role, session end from the API); the header shows "Sign in" / email + "Sign out". Editing pages join the protected set from Phase 2.
- Q: What happens at token expiry while the app is open? → A: Automatic sign-out at the expiry time with a "session expired" toast; on a protected page the admin is sent to sign-in with a return link, on a public page they stay where they are.
- Q: Where does sign-out take the admin? → A: Stay on public pages; leave protected pages for the home page; show "Signed out" toast.
- Q: Rejected credentials UX? → A: One inline form-level message, password cleared and focused, email kept.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin signs in from the web app (Priority: P1)

The admin opens the sign-in page, enters email and password and lands back where they were
going, now shown as signed in (their email in the header).

**Why this priority**: Every editing screen in later phases depends on it.

**Independent Test**: Open the sign-in page, enter the configured admin credentials, and see the
header switch to the signed-in state; reload the page and remain signed in.

**Acceptance Scenarios**:

1. **Given** the sign-in page, **When** the admin submits correct credentials, **Then** they are
   taken to the page they originally wanted (or the home page) and the header shows their email
   and a sign-out action.
2. **Given** wrong credentials, **When** the form is submitted, **Then** one message says the email
   or password is incorrect, the password field is cleared and focused, and the email is kept.
3. **Given** an empty or malformed email or an empty password, **When** the form is submitted,
   **Then** field messages appear next to the fields and nothing is sent.
4. **Given** the service refuses because of too many attempts, **When** the form is submitted,
   **Then** the page says to wait and roughly how long.
5. **Given** the form is submitting, **When** the admin looks at the button, **Then** it shows
   progress and cannot be pressed again.
6. **Given** an already signed-in admin, **When** they open the sign-in page, **Then** they are
   taken to the home page.

---

### User Story 2 - Session survives reloads and ends cleanly (Priority: P1)

The signed-in state survives a page reload or a new tab until the access token expires. When it
expires, or the API says the token is no longer accepted, the app signs the admin out and tells
them why. The admin can also sign out at any time.

**Why this priority**: Without persistence the admin would sign in on every reload; without clean
expiry they would hit confusing errors mid-task.

**Independent Test**: Sign in, reload: still signed in. Sign out: header shows "Sign in" and the
protected page is no longer reachable. Simulate an expired token or a "not signed in" response:
the app signs out and shows a message.

**Acceptance Scenarios**:

1. **Given** a signed-in admin, **When** the page is reloaded, **Then** they stay signed in.
2. **Given** a signed-in admin, **When** they choose sign out, **Then** the session is cleared, a
   confirmation appears and, if they were on a protected page, they are taken to the home page.
3. **Given** a signed-in admin whose token reaches its expiry time while the app is open, **When**
   that moment passes, **Then** the app signs them out and says the session expired.
4. **Given** a stored token that has already expired, **When** the app is opened, **Then** the
   admin is treated as signed out.
5. **Given** any request rejected by the API as "not signed in", **When** the response arrives,
   **Then** the app signs out, says the session is no longer valid and, on a protected page,
   sends the admin to sign in with a link back to where they were.

---

### User Story 3 - Protected pages require sign-in (Priority: P1)

Pages for admins only send signed-out visitors to the sign-in page and bring them back after
signing in. Public pages (status, and in later phases the catalog) never ask for sign-in. In this
phase the protected page is "My account", showing who is signed in and when the session ends.

**Why this priority**: Establishes the pattern every editing screen in later phases uses.

**Independent Test**: Signed out, open "My account": the sign-in page appears; sign in: "My
account" appears with the admin's email, role and session end time.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open a protected page, **Then** they see the
   sign-in page, and after signing in they return to that page.
2. **Given** a signed-in admin, **When** they open "My account", **Then** it shows their email,
   role and when the session ends, as confirmed by the API.
3. **Given** a signed-out visitor, **When** they open the status page, **Then** it shows without
   asking them to sign in.
4. **Given** a sign-in link that points to another website as the return address, **When** the
   admin signs in, **Then** they land on the home page instead.

---

### Edge Cases

- The API is unreachable when signing in: the page says the server cannot be reached and keeps the
  entered email.
- The admin signs out in one tab: other open tabs treat the admin as signed out on their next
  action or when focused.
- Keyboard-only use: the form is fully operable, errors are announced, focus moves to the first
  invalid field.
- Narrow screens (360 px): the sign-in form and header fit without horizontal scrolling.
- The stored session data is corrupted or from an older version: it is ignored and the admin is
  signed out.
- The session is kept in the browser's storage, so a script injected into the page could read it;
  this trade-off is documented and mitigated by the strict content policy and by never rendering
  raw HTML.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a sign-in page with email and password fields, client-side
  checks matching the API's rules, and a single generic message for rejected credentials.
- **FR-002**: On success the app MUST store the session (token, expiry, email, roles) so it
  survives reloads and new tabs, and MUST return the admin to the requested page or the home page.
- **FR-003**: The app MUST attach the token to every API request while signed in.
- **FR-004**: The app MUST sign the admin out when the token expires (at the expiry time while
  open, or on start-up if already expired) and when any API response says "not signed in".
- **FR-005**: The header MUST show "Sign in" when signed out, and the admin's email with a
  "Sign out" action when signed in.
- **FR-006**: The app MUST provide a protected-page mechanism that sends signed-out visitors to
  sign-in with a return address, used by "My account" now and by every editing page later.
- **FR-007**: Return addresses MUST be limited to pages inside the app.
- **FR-008**: "My account" MUST show the signed-in admin's email, role and session end, fetched
  from the API.
- **FR-009**: A "too many attempts" response MUST be shown as a wait message including the retry
  time when the API provides it.
- **FR-010**: Sign-out and expiry MUST clear every trace of the session from the browser and the
  app's cached data that requires sign-in.
- **FR-011**: Every state MUST be designed: submitting, field errors, rejected credentials,
  throttled, server unreachable, signed-in, signed-out, session-expired.
- **FR-012**: There MUST be no registration or account-creation screen.

### Key Entities

- **Session**: token, expiry time, email, roles; kept in browser storage; absent when signed out.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The admin can go from the sign-in page to signed in within 10 seconds.
- **SC-002**: 100% of protected pages redirect signed-out visitors to sign-in and return them after
  sign-in; 0 public pages ask for sign-in.
- **SC-003**: After expiry or a "not signed in" response, the app shows the signed-out state within
  1 second.
- **SC-004**: The sign-in page and header work at 360 px width and with keyboard only.

## Assumptions

- Browser storage for the session is the agreed trade-off (interview decision 19); there are no
  refresh tokens, so after 60 minutes the admin signs in again.
- Sign-out is client-side only (the API has no sign-out operation).
