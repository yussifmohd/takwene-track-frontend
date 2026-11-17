# Research: Admin Sign-in & Session (Web app)

## R1. Dependencies

No new npm packages. zustand 5.0.16 (`persist` middleware), react-hook-form 7.91.0, zod 4.6.7 and
@hookform/resolvers 7.0.1 were installed in Phase 0. shadcn `input` and `label` are added with
`npx shadcn@4.23.0 add input label`; Phase 0 showed `shadcn add` can inject unpinned packages and
rewrite the `cn` import, so `package.json` and imports are reviewed right after.

## R2. Session storage

- **Decision**: `localStorage` via zustand `persist` (interview 19). Versioned (`version: 1`) and
  validated with zod on rehydrate; expired or malformed → dropped.
- **Trade-off**: readable by any script running on the origin (XSS). Mitigations: CSP
  `script-src 'self'` (nginx, Phase 0), no `dangerouslySetInnerHTML` (lint rule), 60-minute token,
  token cleared on sign-out/expiry/401. httpOnly cookies were rejected in the interview (would need
  CSRF protection and a cookie-issuing API).

## R3. 401 handling

- `apiFetch` already calls `onUnauthorized` on 401. Login is excluded (`skipAuthHandling` option)
  because a 401 there means wrong credentials, not an expired session.

## R4. Expiry timer

- `setTimeout(expiresAt - now)`; browsers clamp delays > 2^31-1 ms, irrelevant for 60 min but the
  helper caps at 1 h and re-arms. Background tabs may delay timers; the token is also checked on
  every request (expired tokens are not attached) and on focus.

## R5. Return address

- `?redirect=` holds `pathname + search` of the protected page. Only same-app paths are accepted
  (prevents open redirects such as `//evil.example` or `https://…`).

## R6. Throttling message

- The API sends `Retry-After: <seconds>` with 429 (backend research R5). `ApiError.retryAfterSeconds`
  parses integer seconds; if absent the message omits the number.

## R7. CI actions

- `actions/checkout@v7` (v7.0.1, node24), `actions/setup-node@v7` (v7.1.0, node24); inputs
  `node-version-file` and `cache` unchanged. See backend research R8 for the full table.

## R8. Contract

- `gen:api` points at `../backend/specs/002-jwt-authentication-and-authorization/contracts/openapi.json`
  (exported after the backend implementation). Frontend implementation starts after the backend
  contract exists.
