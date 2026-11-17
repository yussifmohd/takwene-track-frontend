# Feature Specification: Artists (Web app)

**Feature Branch**: `003-artists-and-dsps-management`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Phase 2 – Artists and DSPs (web app). An artists list with Skeleton loading and empty/error states, a create-artist form visible only to a signed-in Admin with field errors from ProblemDetails, the country shown by name, and the UserText component with dir="auto" for artist names. Admin-only writes use the Phase 1 rules."

**Depends on**: API Phase 2 (`../backend/specs/003-artists-and-dsps-management/`).

## Clarifications

### Session 2026-11-17 (recommended defaults; confirmed by the user at the analyze checkpoint, with the email change below)

- Q: Where does the admin create an artist? → A: On its own page, "Add artist", reached from a button on the artists list that only a signed-in admin sees. The page is protected (visitors are sent to sign-in and back). After saving, the admin returns to the list, sees an "Artist added" confirmation, and the list includes the new artist.
- Q: How is the country chosen? → A: From a list of country names (sorted alphabetically, type-to-jump), not by typing a code; the list shows names, the API receives the code.
- Q: Is the artist's email required? → A: **Yes** (changed by the user, to match the assignment's Artist entity and the API). The form asks for Name, Country and Email, all required.
- Q: How does paging work in the list? → A: Previous/Next with "Page X of Y" and the total; the page number is part of the address so a reload or shared link opens the same page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anyone browses the artists (Priority: P1)

Any visitor opens "Artists" and sees the artists with their country written as a name, page by
page. Names in Arabic display right-to-left and Latin names left-to-right, even when mixed in
one list.

**Why this priority**: The first catalog page of the product; public by design and needed before
tracks can be credited to artists.

**Independent Test**: With artists in the API (including Arabic names), open Artists signed out;
see names, country names and totals; move to page 2.

**Acceptance Scenarios**:

1. **Given** artists exist, **When** a visitor opens Artists, **Then** a loading placeholder shaped
   like the list appears, then each artist's name and country name (e.g. "Egypt", not "EG").
2. **Given** an artist named "عمرو دياب", **When** the list shows it, **Then** it reads
   right-to-left and its neighbours in Latin script still read left-to-right.
3. **Given** more artists than one page, **When** the visitor chooses Next, **Then** the next page
   shows, the address includes the page, and "Page 2 of N" and the total are shown.
4. **Given** no artists, **When** the list loads, **Then** an empty state explains there are no
   artists yet (and, for a signed-in admin, offers "Add artist").
5. **Given** the API cannot be reached or fails, **When** the list loads, **Then** an error state
   with Retry is shown; Retry loads the list once the API is back.
6. **Given** a visitor who is not signed in, **When** the list shows, **Then** no email addresses
   appear; a signed-in admin also sees each artist's email.

---

### User Story 2 - Admin adds an artist (Priority: P1)

A signed-in admin adds an artist with name, country and contact email, sees problems next to
the fields they concern, and returns to the list with the artist in it.

**Why this priority**: The only way artists enter the catalog from the product.

**Independent Test**: Signed in as admin, open Add artist, submit invalid values (see field
messages), then valid values (land on the list with a confirmation and the artist visible).

**Acceptance Scenarios**:

1. **Given** a signed-in admin on the artists list, **When** they choose "Add artist", **Then** a
   form with Name, Country and Email (all required) opens.
2. **Given** an empty name, no country, or a missing or malformed email, **When** they submit, **Then** the
   messages appear next to those fields without contacting the server, and focus moves to the
   first problem.
3. **Given** the server refuses a value (e.g. the email is already used by another artist),
   **When** they submit, **Then** the server's message appears next to that field and the other
   values are kept.
4. **Given** valid values, **When** they submit, **Then** the button shows progress and cannot be
   pressed twice; on success they return to the list with an "Artist added" confirmation and the
   new artist is listed.
5. **Given** a name in Arabic, **When** typed into the form, **Then** the field shows it
   right-to-left while typing.
6. **Given** the admin's session expired or was rejected before submitting, **When** they submit,
   **Then** they are signed out with the Phase 1 message and nothing is created.

---

### User Story 3 - Visitors cannot reach the create form (Priority: P1)

The "Add artist" button is hidden from visitors who are not signed in, and opening the form's
address directly sends them to sign-in first and back afterwards.

**Why this priority**: Writes are admin-only (Phase 1 rule); the interface must not invite
actions that will be refused.

**Independent Test**: Signed out, open Artists (no button) and open the form's address directly
(redirected to sign-in, then back to the form after signing in).

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open Artists, **Then** no "Add artist"
   control is shown.
2. **Given** a visitor who is not signed in, **When** they open the Add artist address, **Then**
   they are sent to sign-in and, after signing in, returned to the form.
3. **Given** a signed-in user without the Admin role (not possible today, but defended), **When**
   they open Artists, **Then** no "Add artist" control is shown.

---

### Edge Cases

- Very long names wrap instead of widening the page (also at 360 px).
- An unknown country code from the API (not in the name list) shows the code itself.
- A page number in the address that is not a number or below 1 is treated as page 1; a page past
  the end shows the empty-page state with a way back to page 1.
- Unsaved form input when leaving the page is discarded (no warning in this phase).
- The navigation's "Artists" entry is no longer marked "coming soon".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST show a public Artists page listing name and country name per artist,
  with the total count and page navigation (Previous/Next, "Page X of Y"); the page number is
  kept in the address.
- **FR-002**: Every artist name MUST be rendered as user text with automatic direction, so Arabic
  and Latin names each read correctly.
- **FR-003**: Country codes MUST be shown as country names in the interface language (English).
- **FR-004**: Loading MUST show a placeholder shaped like the list; empty and error states MUST be
  designed, the error state with Retry.
- **FR-005**: Email addresses MUST only be shown to a signed-in admin.
- **FR-006**: The "Add artist" control and page MUST only be available to a signed-in admin; the
  page MUST be protected like other protected pages (sign-in and return).
- **FR-007**: The form MUST check required name, country and email, name and email length, and email format before
  sending, using the same limits as the API.
- **FR-008**: Validation and conflict errors from the server MUST appear next to the field they
  name; other errors appear as a message on the form.
- **FR-009**: Successful creation MUST return the admin to the list with a confirmation and an
  up-to-date list.
- **FR-010**: The country MUST be chosen from a list of country names; the API receives the code.
- **FR-011**: The API types used by this feature MUST come from the backend contract.

### Key Entities

- **Artist (as shown)**: name, country (shown by name), email (admin only).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin adds an artist, including correcting one field error, in under 1 minute.
- **SC-002**: 100% of server field errors in tests appear next to their field.
- **SC-003**: Arabic, Latin and mixed names in the list and form display in their natural
  direction (verified in a real browser, light and dark, at 360 px and desktop).
- **SC-004**: 0 create controls or email addresses visible to signed-out visitors.
- **SC-005**: The Artists page shows content or a placeholder within 1 second on a local stack.

## Assumptions

- Edit/delete and artist detail pages are out of scope (the API has no such operations in this phase).
- Distribution platforms are not shown in the web app in this phase; they are used in Phase 4.
- Country names come from the browser's built-in region names; the list of codes matches the API's.
