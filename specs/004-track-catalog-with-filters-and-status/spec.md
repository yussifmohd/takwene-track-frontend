# Feature Specification: Track Catalog with Filters and Status (Web app)

**Feature Branch**: `004-track-catalog-with-filters-and-status`

**Created**: 2026-11-17

**Status**: Draft

**Depends on**: API Phase 3 (`../backend/specs/004-track-catalog-with-filters-and-status/`).

**Input**: User description: "Phase 3 – Tracks (web app). Track list as the home page: title, artist name, genre, status badge, release date; status filter in the address (plus genre and artist filters if cheap); pagination with the page in the address; Skeleton loading, empty and error states. The health status becomes a small status dot in the header, and the old status page content moves accordingly; the Tracks navigation entry is enabled. Track detail page with full information and a distributions section that shows an empty state until Phase 4. Create-track form (admin only): title, artist (searchable or simple select), ISRC (accepts hyphens, shows format errors), genre, release date; server field errors next to their fields (a duplicate ISRC under ISRC). Admin-only status change control on the detail page offering only the allowed next statuses. Titles and artist names through UserText; Skeleton for all loading; the existing sign-out redirect behavior."

## Clarifications

### Session 2026-11-17 (recommended defaults, pending the user's confirmation at the analyze checkpoint)

One batched round for both repos; Q1–Q4 are in the API spec and apply here too (all statuses visible
to everyone; no edit/delete; artists found by typing; newest release date first).

- Q5: Should marking a track as distributed ask for confirmation? → A (recommended): **Yes.** Distributed
  is final, so that one change asks "Mark as distributed? This cannot be undone." before it is sent;
  submitting and withdrawing happen in one click.

Decided without a question (reasonable defaults, listed in Assumptions): the full status page moves to
`/status` and the header dot links there; genre and artist filters are included (the API supports
them); a filter change returns to page 1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anyone browses and filters the catalog on the home page (Priority: P1)

Any visitor opens the app and sees the tracks: title, artist name, genre, status and release date,
a page at a time, and can narrow the list by status, genre and artist. The address keeps the filters
and the page, so a reload or a shared link shows the same list.

**Why this priority**: The catalog is the product's front door.

**Independent Test**: With tracks across statuses, genres and artists, open `/`, apply each filter,
page through, reload, use Back.

**Acceptance Scenarios**:

1. **Given** tracks exist, **When** anyone opens `/`, **Then** a placeholder shaped like the list
   appears, then each track's title, artist name, genre, a status badge and release date, newest
   release first.
2. **Given** the list, **When** the visitor chooses status "Submitted", **Then** only submitted
   tracks show, the address contains the status, the page goes back to 1, and a reload keeps it.
3. **Given** a genre and an artist filter, **When** chosen together with a status, **Then** only
   tracks matching all are shown; a "Clear filters" action returns to the full list.
4. **Given** more than one page, **When** Next/Previous is used, **Then** the page number is in the
   address and Back returns to the previous page.
5. **Given** filters that match nothing, **When** applied, **Then** an empty state says so and offers
   to clear the filters; **Given** no tracks at all, **Then** the empty state says so (with "Add
   track" for an admin).
6. **Given** the API cannot be reached, **When** the list loads, **Then** an error state with Retry
   is shown.
7. **Given** an Arabic title or artist name, **When** shown, **Then** it reads right-to-left within
   the left-to-right page.

---

### User Story 2 - Anyone opens a track (Priority: P1)

Any visitor opens a track from the list and sees all its information and a distributions section that
says there are no distributions yet.

**Why this priority**: Where status is changed and, in Phase 4, where distribution is followed.

**Independent Test**: Open `/tracks/<id>` directly and from the list; open an unknown id.

**Acceptance Scenarios**:

1. **Given** a track, **When** opened, **Then** title, artist, ISRC (with hyphens), genre, status,
   release date, added and last-changed times are shown, and the distributions section shows an empty
   state ("Not sent to any platform yet").
2. **Given** an unknown id, **When** opened, **Then** a "Track not found" page with a link to the
   catalog is shown.
3. **Given** loading, **Then** a placeholder shaped like the detail page is shown.

---

### User Story 3 - Admin adds a track (Priority: P1)

The signed-in admin adds a track from the catalog page and lands on its detail page.

**Why this priority**: The only way tracks enter the catalog from the product.

**Independent Test**: As admin, open Add track, submit invalid values (see field messages), a
duplicate ISRC (message under ISRC), then valid values (land on the new track).

**Acceptance Scenarios**:

1. **Given** a signed-in admin on the catalog, **When** they choose "Add track", **Then** a form with
   Title, Artist, ISRC, Genre and Release date opens (all required).
2. **Given** the Artist field, **When** the admin types part of a name (Latin or Arabic), **Then**
   matching artists are offered and one can be chosen with mouse or keyboard.
3. **Given** an ISRC in the wrong shape, **When** they leave the field or submit, **Then** a message
   explains the format ("CC-XXX-YY-NNNNN, e.g. EG-A1B-26-00001"); hyphens and lower case are accepted.
4. **Given** the server refuses a value (e.g. the ISRC is already used), **When** they submit, **Then**
   the message appears under that field and the other values are kept.
5. **Given** valid values, **When** submitted, **Then** the button shows progress, cannot be pressed
   twice, and on success the new track's page opens with an "Track added" confirmation.
6. **Given** a visitor or a signed-in user without the Admin role, **Then** "Add track" is not shown
   and the form address shows sign-in (visitor) or "Only admins can add tracks" (non-admin).

---

### User Story 4 - Admin changes a track's status (Priority: P1)

On the track page, the signed-in admin sees only the status changes that are allowed next and applies
one.

**Why this priority**: The core workflow; the API refuses others, so offering them would only cause
errors.

**Independent Test**: Walk a track draft → submitted → draft → submitted → distributed in the UI.

**Acceptance Scenarios**:

1. **Given** a draft, **Then** the admin sees "Submit"; **given** a submitted track, "Withdraw to
   draft" and "Mark as distributed"; **given** a distributed track, no change controls and a note that
   distributed is final.
2. **Given** "Mark as distributed", **When** chosen, **Then** a confirmation is asked first; cancelling
   changes nothing.
3. **Given** a change is applied, **Then** the badge, the allowed changes and the list update, and a
   confirmation is shown.
4. **Given** someone else changed the track meanwhile (the API answers with a conflict), **When**
   applying, **Then** the message is shown and the page reloads the track's current state.
5. **Given** a visitor or non-admin, **Then** no change controls are shown.

---

### User Story 5 - Service status in the header (Priority: P3)

Everyone sees a small status dot in the header showing whether the service is healthy, and can open
the full status page from it.

**Why this priority**: Keeps the Phase 0 health information without occupying the home page.

**Independent Test**: Healthy, degraded and unreachable API; click the dot.

**Acceptance Scenarios**:

1. **Given** the API is healthy, **Then** the dot is the "healthy" colour and its accessible name says
   "Service status: healthy"; degraded/unavailable/unreachable show their own colour and name.
2. **Given** the dot, **When** clicked, **Then** the full status page (`/status`) opens with the
   Phase 0 health card.

---

### Edge Cases

- Filter values in the address that are not valid (unknown status or genre, malformed artist id,
  non-numeric page) are ignored (treated as no filter / page 1) instead of breaking the page.
- An artist filter in the address shows the artist's name once loaded; an unknown artist shows "Unknown
  artist" and can be cleared.
- Very long titles and names wrap (also at 360 px).
- The ISRC is shown with hyphens everywhere and typed in any form.
- The release date is shown as a calendar date without time-zone shifts (2026-12-01 is "1 Dec 2026"
  everywhere).
- Unsaved form input when leaving is discarded (no warning, as for artists).
- A status change while the session expired → Phase 1 sign-out behaviour, back to the track afterwards.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `/` MUST show the public track list with title, artist name, genre, status badge and
  release date; Skeleton while loading; designed empty and error (with Retry) states.
- **FR-002**: Status, genre and artist filters and the page number MUST live in the address; changing a
  filter resets the page to 1; invalid values in the address are ignored.
- **FR-003**: Titles and artist names MUST be rendered as user text with automatic direction.
- **FR-004**: `/tracks/:id` MUST show all track fields and a distributions section with an empty state;
  unknown ids show a not-found page.
- **FR-005**: Only a signed-in admin MUST see "Add track" and reach the form; the form page MUST be
  protected like Add artist (sign-in and return; non-admin message).
- **FR-006**: The form MUST check required fields, title length (200), ISRC format (with or without
  hyphens, any case) and a real date before sending, with the same rules as the API.
- **FR-007**: The artist MUST be chosen by typing part of the name and picking from matches.
- **FR-008**: Server validation and conflict errors MUST appear next to their field (duplicate ISRC
  under ISRC); other errors as a message on the form.
- **FR-009**: The status control MUST offer only the changes the API reports as allowed for the track,
  only to an admin; marking distributed MUST ask for confirmation.
- **FR-010**: After a create or a status change, every list and the track page MUST show the new state.
- **FR-011**: The header MUST show a service status dot with an accessible name, linking to `/status`
  with the full health card; the "Tracks" navigation entry MUST be a real link to the catalog.
- **FR-012**: API types MUST come from the backend contract.

### Key Entities

- **Track (as shown)**: title, artist name, ISRC (hyphenated), genre, status, release date, added,
  last changed, allowed next statuses, distributions (empty).
- **Catalog filters**: status, genre, artist, page – all in the address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin adds a track, including correcting one field error, in under 1 minute.
- **SC-002**: 100% of server field errors in tests appear next to their field.
- **SC-003**: A filtered view survives reload and Back in 100% of tested cases.
- **SC-004**: 0 status controls that the API would refuse are offered.
- **SC-005**: The catalog shows content or a placeholder within 1 second on a local stack.
- **SC-006**: Arabic, Latin and mixed titles display in their natural direction (real browser, light
  and dark, 360 px and desktop).

## Assumptions

- The full status page moves from `/` to `/status`; the header dot links there.
- Genre and artist filters are included because the API supports them at no extra cost.
- The list's page size is fixed at 20 (as for artists).
- Editing and deleting tracks are out of scope (Q2).
- The login page's "What signing in unlocks" list is updated to what admins can actually do.
