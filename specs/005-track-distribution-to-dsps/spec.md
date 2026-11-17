# Feature Specification: Track Distribution to DSPs (Web app)

**Feature Branch**: `005-track-distribution-to-dsps`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Phase 4 – Distribution (web app). Track detail shows a per-DSP table with status badges and times. Replace the "Mark as distributed" button with a "Distribute" dialog (multi-select of DSPs not already pending or live) and an admin control to set live or rejected. Remove the "marked as distributed without platform deliveries" text, and say how existing local data without distributions is handled. Skeleton loading, UserText, the usual rules."

**Depends on**: API Phase 4 (`../backend/specs/005-track-distribution-to-dsps/`).

## Clarifications

### Session 2026-11-17 (confirmed by the user at the analyze checkpoint; Q1 changed by the user)

API questions Q1–Q4 are in the API spec (Q1, changed by the user: no data migration – local databases
created before distributions are reset with `docker compose down -v`; Q4: deliveries show a sent time
and an answer time).

- Q5: How does the admin record a platform's answer, and what does the Distribute dialog offer? → A
  (recommended, confirmed): **Two buttons on each pending row, "Mark live" and "Mark rejected", without a
  confirmation** (the simulation is labelled as such; live and rejected rows show no buttons). The
  **Distribute** dialog lists every platform as a checkbox: never-sent and rejected ones can be
  chosen ("Send again" for rejected), pending and live ones are shown disabled with their status;
  nothing is preselected; the send button names the count ("Send to 2 platforms") and is disabled until
  one is chosen.

## How existing local data is handled

Before this phase an admin could mark a track "distributed" without any delivery, and the track page
said "Marked as distributed without platform deliveries recorded." That text is removed and the web app
has **no special case** for a distributed track without deliveries. No real data exists: local
databases created before distributions are reset with `docker compose down -v` in the backend repo
(documented in both READMEs and Memory.md), and Phase 5's seed creates consistent data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anyone sees where a track was delivered (Priority: P1)

A visitor opening a track sees a table with one row per platform delivery: platform name, status badge
(pending, live, rejected), when it was sent and when the platform answered.

**Why this priority**: Following deliveries is the reason to open a distributed track.

**Independent Test**: Open a track with three deliveries in different states; open one with none.

**Acceptance Scenarios**:

1. **Given** a track with Spotify live, Apple Music pending and YouTube Music rejected, **When** anyone
   opens it, **Then** a table lists the three platforms (by name) with status badges in words, the sent
   time, and the answer time ("Waiting" for pending).
2. **Given** a track without deliveries, **When** opened, **Then** the section says "Not sent to any
   platform yet."
3. **Given** the page is loading, **When** it renders, **Then** the placeholder includes the shape of
   the deliveries section.
4. **Given** a visitor (not an admin), **When** viewing, **Then** no Distribute button and no answer
   buttons are shown.

---

### User Story 2 - Admin distributes a track (Priority: P1)

The admin opens **Distribute**, picks one or more platforms, and sends. The deliveries appear as
pending, and the track shows as distributed.

**Why this priority**: Replaces the Phase 3 "Mark as distributed" button, which recorded no platform.

**Independent Test**: As admin, distribute a submitted track to two platforms; then send the third
later; send a rejected one again.

**Acceptance Scenarios**:

1. **Given** a submitted track, **When** the admin opens the track, **Then** the status control offers
   "Withdraw to draft" only, and a separate **Distribute** button is shown; "Mark as distributed" no
   longer exists.
2. **Given** the dialog is open, **When** it shows the platforms, **Then** never-sent and rejected
   platforms are selectable, pending and live ones are disabled with their status, and the send button
   is disabled until one is chosen and names the count.
3. **Given** two platforms chosen, **When** sent, **Then** the dialog shows progress, closes on success,
   a confirmation names the count ("Sent to 2 platforms"), the table shows them as pending and the
   badge shows distributed.
4. **Given** every platform is pending or live, **When** the admin views the track, **Then** Distribute
   is disabled with the reason ("Sent to every platform").
5. **Given** a draft track, **When** viewed by the admin, **Then** Distribute is not offered (submit
   first).
6. **Given** someone else changed the track meanwhile (conflict), **When** sending, **Then** the reason
   is shown, the track is reloaded and the dialog closes; a rejected session signs out as in Phase 1.

---

### User Story 3 - Admin records a platform's answer (Priority: P2)

On each pending delivery the admin can mark the platform's answer as live or rejected (a simulation of
the platform).

**Why this priority**: Makes deliveries move during review; real platforms are not connected.

**Acceptance Scenarios**:

1. **Given** a pending row, **When** the admin chooses "Mark live", **Then** the row shows live with an
   answer time and loses its buttons; a confirmation names the platform.
2. **Given** a pending row, **When** "Mark rejected" is chosen, **Then** the row shows rejected, and the
   platform becomes selectable in Distribute ("Send again").
3. **Given** a conflict (already answered elsewhere), **When** choosing an answer, **Then** the reason is
   shown and the track reloads.

---

### Edge Cases

- Platform names come from the API and are shown as user text.
- Times are shown in the viewer's time zone; release dates stay calendar dates.
- At 400 px the table becomes stacked rows; buttons wrap.
- The Distribute dialog is keyboard-operable (checkboxes, Escape closes, focus returns to the button).
- The platform list for the dialog comes from the API's platform list; if it fails to load, the dialog
  shows an error with Retry instead of an empty list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The track page MUST show deliveries as a table (stacked on phones): platform, status badge
  in words, sent time, answer time; empty state "Not sent to any platform yet."
- **FR-002**: The "Marked as distributed without platform deliveries recorded." text and the "Mark as
  distributed" button MUST be removed; status buttons come only from the API's allowed next statuses.
- **FR-003**: An admin MUST be able to distribute a submitted or distributed track through a dialog
  offering only platforms not pending or live (rejected ones as "Send again").
- **FR-004**: An admin MUST be able to mark a pending delivery live or rejected; the buttons come from
  the API's allowed answers for that delivery.
- **FR-005**: Every change MUST update the page from the API's answer, show a confirmation, and handle
  conflict (reason + reload), rejected session (Phase 1 sign-out) and other errors (toast).
- **FR-006**: Loading MUST use placeholders shaped like the content; platform names through `UserText`.
- **FR-007**: Distribute and answer controls MUST NOT be shown to visitors or non-admins.
- **FR-008**: API types MUST come from the backend contract.

### Key Entities

- **Delivery (as shown)**: platform name, status (pending, live, rejected), sent time, answer time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin distributes a track to two platforms and marks one live in under 30 seconds.
- **SC-002**: 0 distribute or answer controls visible to signed-out visitors.
- **SC-003**: Platform statuses are readable without colour (text in every badge), in light and dark,
  at 400 px and desktop (real-browser check).

## Assumptions

- Seed data with varied deliveries comes with Phase 5; until then deliveries are created in the app.
- The track list does not show deliveries (only the detail does).
