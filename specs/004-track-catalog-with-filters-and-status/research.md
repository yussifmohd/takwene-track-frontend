# Research: Track Catalog with Filters and Status (Web app)

## R1 – Filters in the address
- Params: `status`, `genre`, `artistId`, `page`. Parsed values: status ∈ contract union, genre ∈
  contract union (exact, URL-encoded e.g. `R%26B`), artistId matches a GUID, page integer ≥ 1.
- Invalid → treated as absent (spec edge case), not rewritten in the URL (no surprise redirects).
- Changing a filter: `setSearchParams` with `page` removed. Query key includes the parsed filters, so
  each combination is cached separately; `keepPreviousData` avoids flashing between pages.

## R2 – Allowed status changes
- Source: `allowedNextStatuses` in `TrackDetailDto`. The client has labels only.
- Confirmation for `distributed` (Q5) via AlertDialog: title "Mark as distributed?", text "Distributed
  is final. The status can't change after this.", actions "Mark as distributed" / "Cancel".

## R3 – Cache
- Keys: `trackKeys.all = ["tracks"]`, `lists()`, `list(filters)`, `detail(id)`.
- Tracks contain no personal data → not dropped on sign-out. Artist search results live under
  `["artists", …]` and are already dropped on sign-out (Phase 2).
- Errors: 404 detail → not-found view; 409 status → toast(`problem.detail`) + `invalidateQueries(detail)`.

## R4 – Artist picker
- Pattern: WAI-ARIA APG "Combobox with listbox popup" (editable, list autocomplete).
- Input `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; options
  `role="option"` with `aria-selected`; Down/Up move, Enter selects, Escape closes/clears, Tab leaves.
- Search starts at 1 character, debounced 250 ms; states: searching (skeleton rows), "No artists
  match", error with retry; option text through `UserText`.
- Value = artist id; react-hook-form `Controller`; label shows the selected name.
- Alternatives: native `<select>` with all artists (doesn't scale, would page through the API);
  shadcn Combobox (needs `cmdk`, a new dependency).

## R5 – ISRC
- `normalizeIsrc(input)`: trim + upper case; valid iff `^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$` or
  `^[A-Z]{2}[A-Z0-9]{3}\d{7}$`. `formatIsrc` only for display of user input previews; API output is
  already hyphenated. Shared test table mirrors the backend's cases.

## R6 – Calendar dates
- `formatCalendarDate("2026-12-01")` → "1 Dec 2026" using `Intl.DateTimeFormat("en-GB", { timeZone: "UTC" })`
  on `Date.UTC(y, m-1, d)`; test under a negative-offset time zone stub.

## R7 – Health in the header
- `StatusDot` reads `useHealthQuery`; states healthy (teal), degraded (saffron), unavailable/
  unreachable (rose), loading (muted pulse). `NavLink` to `/status`, `aria-label` "Service status: …".
- `HomePage` renamed `StatusPage`; content unchanged (Phase 0 health card).
