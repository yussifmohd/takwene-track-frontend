# Research: Security Hardening, Documentation and End-to-End Check (web app)

## R1 – Development-tool vulnerabilities (Q3)
`npm audit` on 2026-11-17: 21 findings (13 high, 8 moderate); `npm audit --omit=dev`: **0**.
Root causes:
- `picomatch` ≤ 4.0.7 (ReDoS). 4.0.7 is the newest release, so **no fixed version exists**. Reached via
  vite, vitest (tinyglobby/fdir) and the shadcn CLI. It only matches the project's own glob patterns at
  build/test time; no user input reaches it. → **Accept**, documented; re-check when a fix ships.
- `minimatch` ≥ 7 < 11.0.1 (ReDoS). Copies at 10.2.6 under eslint and ts-morph (shadcn CLI).
  11.0.4 (2026-11-02, BlueOak-1.0.0 – permissive, OSI-approved) meets the two-week rule. → **Remove the
  shadcn CLI** (unused: components are hand-written because the CLI injects an unrelated `cn` package;
  `components.json` only configures that CLI and goes too), then try an `overrides` entry pinning
  eslint's `minimatch` to 11.0.4; keep it only if lint, typecheck, tests and build pass, otherwise accept
  and document. `minimatch@5.1.9` (openapi-typescript) is outside the affected range.
- `typescript-eslint` 8.73.0 / `eslint` 10.15.0 would also resolve some rows but were published
  2026-11-16 / 2026-11-13 (< 2 weeks) → not used.

## R2 – Font served by the app (Q4)
- Today `index.html` loads Readex Pro from `fonts.googleapis.com` / `fonts.gstatic.com` (visitor IPs go to
  Google; the CSP must allow both hosts).
- **Decision**: download the Readex Pro variable font (SIL Open Font License 1.1) from the google/fonts
  repository, convert nothing, commit the `woff2` files with `OFL.txt` under `public/fonts/`, declare
  `@font-face` (weights 300–600, `font-display: swap`, `unicode-range` for Latin and Arabic files if the
  source provides them), remove the three `<link>` tags, drop both Google hosts from the CSP.
  No package. The system font stack stays as fallback.

## R3 – nginx headers
- Headers are repeated in three places, and the `/api/` location inherits the server-level ones while the
  API (new in this phase) sends its own → duplicate headers on API responses.
- **Decision**: one snippet `nginx/security-headers.conf` included in `/` and `/assets/`; `/api/` passes the
  API's headers unchanged (no nginx copy). CSP becomes `default-src 'self'; script-src 'self'; style-src
  'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors
  'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. Add `Cross-Origin-Opener-Policy:
  same-origin`. `'unsafe-inline'` for styles stays (Radix and sonner set inline styles) – documented.
- **Evidence**: `curl -sI` against the running container for `/`, `/tracks/x`, `/assets/<file>`, `/api/health`.

## R4 – Image
- Already multi-stage, `nginx-unprivileged` (uid 101), only `dist/` + config. Check: `.dockerignore`
  excludes `.env*`, `node_modules`, tests; Trivy scan (pinned image, see backend R10).

## R5 – End-to-end check
- Scratch script over the Edge DevTools protocol (as in earlier phases), on both compose stacks with a fresh
  database (sample data): visitor browses with each filter, opens a distributed track; admin signs in, adds
  an artist and a track, submits, distributes to two platforms, marks one live and one rejected, sends it
  again, signs out. Desktop light and 400 px dark; console errors and overflow recorded. Results in the
  walkthrough and the backend ai-log.

## R6 – Dead code and clean clone
- Check: unused exports/files (TypeScript `noUnusedLocals` is already on; grep for `console.`, `debugger`,
  TODO), unused packages after removing shadcn, stale `specs` references in scripts. Clean clone into a new
  scratch folder: `npm ci`, lint, typecheck, tests, build.
