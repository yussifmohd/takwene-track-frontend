# Research: Artists (Web app)

## R1 – Country names without a dependency
- **Decision**: `Intl.DisplayNames(["en"], { type: "region" }).of(code)` (all evergreen browsers and
  Node 26/jsdom). Codes list copied from the API's `CountryCodes` (249); test asserts count and the
  SHA-256 of the comma-joined sorted list equals the backend's constant.
- **Rejected**: `i18n-iso-countries` or similar (adds ~20–80 kB and a dependency for data the browser has).

## R2 – Picker
- **Decision**: native `<select>` with `<option value="EG">Egypt</option>…` sorted by name.
- **Why**: accessible, mobile-native, type-to-jump, zero code; 249 options are fine.
- **Rejected**: shadcn Combobox (needs `cmdk` + popover; more code and a new dependency for no requirement).

## R3 – Paging state
- `usePageParam()` reads `?page`, parses `Number`, returns 1 for NaN/≤0; `setPage(n)` writes the
  param (`replace: false` so Back works). Query key `artistKeys.list({ page, pageSize: 20 })`;
  `placeholderData: keepPreviousData`; Previous disabled on page 1, Next disabled on the last page.
- Page past the end (totalCount > 0, items empty) → "This page is empty" with "Go to page 1".

## R4 – Emails
- API omits `email` for anonymous callers; the UI also gates the column on `useIsAdmin()` so a stale
  cached admin response is not shown after sign-out (Phase 1 SessionWatcher removes only `["auth"]`;
  this phase also removes `artistKeys.all` on sign-out to drop cached emails).

## R5 – Form and server errors
- API keys: `name`, `countryCode`, `email` (camelCase, from the contract). 400 and 409 carry
  `errors`; both go through `getFieldErrors` → `setError(field, { message }, { shouldFocus })`.
- Name input `dir="auto"`; email `dir="ltr"`, `type="email"`, `autoComplete="off"`.
- Code-point length: `[...value.trim()].length` matches the API (R6 there).

## R6 – Role-aware guard
- `RequireAuth` (Phase 1) only checks sign-in. Add optional `requiresRole` in the route handle; signed
  in without the role → inline "Only admins can add artists" with a link back. Sign-in redirect
  unchanged for signed-out visitors.

## R7 – After create
- `onSuccess`: `queryClient.invalidateQueries({ queryKey: artistKeys.lists() })` then
  `navigate("/artists")` (page 1, sorted by name, so the new artist may be on another page — the toast
  names the artist: "Artist added: <name>" rendered as text).
