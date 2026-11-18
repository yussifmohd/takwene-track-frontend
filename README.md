# Takwene Track Management – Web app

A React single-page app for a music distributor's catalogue. Anyone can browse **tracks** (filter by
artist, genre and status), open a track to see where it was delivered (Spotify, Apple Music, YouTube
Music: pending, live or rejected, with times) and browse **artists**. The signed-in admin adds artists
and tracks, submits or withdraws tracks, **distributes** them to platforms and records each platform's
(simulated) answer. It talks only to the API in the backend repo.

- API: [takwene-track-backend](https://github.com/yussifmohd/takwene-track-backend)
- How the code works, feature by feature: [docs/walkthrough.md](docs/walkthrough.md)
- Design decisions and AI usage (both repos): [backend DECISIONS.md](https://github.com/yussifmohd/takwene-track-backend/blob/main/DECISIONS.md)
  (detailed log: [backend docs/ai-log.md](https://github.com/yussifmohd/takwene-track-backend/blob/main/docs/ai-log.md))
- Security review of both repos: [backend docs/security-review.md](https://github.com/yussifmohd/takwene-track-backend/blob/main/docs/security-review.md)

## Tech stack

React 19 + TypeScript 5.9 (strict) + Vite 8 · React Router 8 · TanStack Query (server state) ·
zustand (session) · shadcn/ui components (written into the repo) on Radix + Tailwind 4 · react-hook-form + zod · API types generated
from the backend's OpenAPI contract · Vitest + Testing Library + MSW · nginx (container) ·
Readex Pro font (Latin + Arabic) served by the app itself, under the SIL Open Font License (`public/fonts/OFL.txt`).

## Quick start

The web app needs the API. Clone both repos side by side (`backend/` and `frontend/`).

### With Docker (recommended)

Start the backend stack first; it creates the `trackmgmt-net` network and the `api` service:

```bash
cd backend && cp .env.example .env   # set the values described in the backend README
docker compose up -d --build
cd ../frontend && docker compose up --build
```

Open http://localhost:8081. nginx serves the app and proxies `/api/*` to `http://api:8080`
(override with `API_UPSTREAM`). If the API is down, pages still load and say "Can't reach the
server" with a Retry button.

On a fresh database the API adds a **sample catalogue** (17 artists, 32 tracks with deliveries in every
state). Artist names, song titles and genres are real; ISRCs (`XX-SMP-…`), emails (`@example.com`),
dates and statuses are invented sample data. Details: the backend README ("Sample data").

A backend database created before platform deliveries existed can hold tracks marked distributed
without any delivery; the API no longer allows that and nothing repairs them. Reset it with
`docker compose down -v` in the backend repo.

### Without Docker

Node 26.13.1 (`.nvmrc`) with npm, and the API running on http://localhost:8080 (see the backend README).

```bash
npm ci
npm run dev        # http://localhost:5173, proxies /api to http://localhost:8080
```

## Configuration and environment variables

| Variable | Where | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | build time (`.env.local`) | `/api` | keep `/api`: Vite proxies it in development, nginx in Docker |
| `API_UPSTREAM` | container (compose) | `http://api:8080` | where nginx forwards `/api/*` |

Anything prefixed `VITE_` ends up in the public bundle, so no secrets belong in `.env` files here.
The nginx config sets the security headers once, in `nginx/security-headers.conf`, and includes them in
every location that serves the app: a Content Security Policy that allows only this site (no
third-party scripts, styles, fonts or connections; `object-src 'none'`, `frame-ancestors 'none'`),
`nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy and
`Cross-Origin-Opener-Policy`. `/api/*` responses keep the API's own headers. The page makes no request
to any other host (`src/thirdPartyHosts.test.ts` fails if a third-party URL appears).

## Database migrations

The web app has no database. Migrations belong to the API and run when it starts in Docker; see
the backend README ("Migrations").

## Signing in (JWT)

Browsing is public. Sign in at `/login` with the admin account from the backend's `.env`
(`ADMIN__EMAIL` / `ADMIN__PASSWORD`); there is no registration. The login page calls
`POST /api/auth/login` and keeps the returned JWT; every later call sends it as a Bearer token.
To get a token for curl or Scalar instead, see the backend README ("Getting a JWT").

- Protected pages (`/account`; admin-only `/artists/new`, `/tracks/new`) send signed-out visitors to
  `/login?redirect=…` and return them after signing in (only to paths on this site).
- Sessions last 60 minutes and are not renewed. The app signs out when the token expires (also
  checked when the tab regains focus), when the API answers `401`, and when you sign out in another
  tab; every sign-out lands on `/login`, and automatic ones explain why.
- **Token storage trade-off**: the session is kept in `localStorage` (`trackmgmt.session`) so it
  survives reloads; any script on this origin could read it. Reduced by the strict CSP, rendering user
  text only as text (no `dangerouslySetInnerHTML`, enforced by lint), short-lived tokens and clearing
  storage on sign-out. An httpOnly cookie would avoid it but needs CSRF protection and a cookie-issuing API.

## Tests and checks

| Script | What it does |
|---|---|
| `npm test` | Vitest in watch mode; `npm test -- --run` for one run |
| `npm run lint` / `npm run typecheck` | ESLint (no warnings allowed) / TypeScript |
| `npm run build` | type-check and production build to `dist/` |
| `npm run dev` | Vite dev server with the `/api` proxy |
| `npm run gen:api` | regenerate `src/api/schema.d.ts` from the backend contract |

Tests render pages with a memory router and answer API calls with MSW handlers that follow the API's
rules (`src/test/server.ts`); unhandled requests fail the test.

**API types.** `src/api/schema.d.ts` is generated from
`../backend/specs/<feature>/contracts/openapi.json` and committed, so CI does not need the backend.
Never edit it by hand; regenerate it when the contract changes and let the type errors show what changed.

**CI.** `.github/workflows/frontend-ci.yml` runs on every pull request to `main`: `npm ci`, lint,
typecheck, tests, build and an initial-JS budget (< 250 kB gzip).

**Branch protection** is not enabled on GitHub for this repository. Every change went through a pull
request with a green CI run and was merged by the developer (merge commits, no force-push). For a team,
protect `main`: require a pull request and the CI check, block force-pushes and deletions.

**Images.** The container's runtime stage removes curl (unused) and upgrades the base image's Alpine
packages at build time, because the newest base tag still ships packages with known CVEs. Those
packages are not pinned, so re-scan the image (e.g. Trivy) on every rebuild; see the security review.

## Pages and the API calls behind them

| Page | Who | What | API |
|---|---|---|---|
| `/` | anyone | track catalogue, 20 per page; filters and page in the address | `GET /api/tracks`, `GET /api/artists?search=` |
| `/tracks/:id` | anyone | track details and its deliveries per platform | `GET /api/tracks/{id}` |
| `/tracks/:id` | admin | Submit / Withdraw to draft | `PATCH /api/tracks/{id}/status` |
| `/tracks/:id` | admin | **Distribute** dialog | `GET /api/dsps`, `POST /api/tracks/{id}/distribute` |
| `/tracks/:id` | admin | Mark live / Mark rejected on a pending delivery | `PATCH /api/tracks/{id}/distributions/{dspId}` |
| `/tracks/new` | admin | add a track | `POST /api/tracks` |
| `/artists` | anyone | artists, 20 per page; emails only for admins | `GET /api/artists` |
| `/artists/new` | admin | add an artist | `POST /api/artists` |
| `/login`, `/account` | – / signed in | sign in, session details | `POST /api/auth/login`, `GET /api/auth/me` |
| `/status` | anyone | service health (also the dot in the header) | `GET /api/health` |

### Behaviour worth knowing

- **The API decides what is allowed.** Buttons come from the track's `allowedNextStatuses`,
  `canDistribute` and each delivery's `allowedAnswers`; the app keeps no copy of the rules.
- **No "Mark as distributed".** The API refuses `PATCH` to distributed (`409`): a track becomes
  distributed only when it is sent to at least one platform, so the page offers **Distribute** instead.
- **Distribute** lists every platform: never-sent and rejected ones can be chosen (rejected ones say
  "Send again"); pending and live ones are disabled and show their status. Nothing is preselected; the
  button names the count ("Send to 2 platforms"). When every platform is pending or live, Distribute
  is disabled with "Sent to every platform". Draft tracks must be submitted first.
- **Deliveries** show the platform, a status badge (the word plus a mark: open ring pending, dot live,
  struck dot rejected), when it was sent and when the platform answered ("Waiting" while pending);
  stacked rows on phones. Platform answers are simulated by the admin, and the page says so.
- **Conflicts**: if someone else changed the track meanwhile, the API answers `409`; the page shows
  the reason and reloads the track.
- Text entered by people (titles, names) is shown right-to-left when it is Arabic; times are in the
  viewer's time zone, release dates are calendar dates.
- Country names come from the browser (`Intl.DisplayNames`, English) except `PS`, shown as "Palestine";
  the code list matches the API's (a test compares hashes).

## Project structure

```text
src/
  api/          client.ts (fetch wrapper), problem.ts (ProblemDetails), schema.d.ts (generated), one file per API area
  features/     <feature>/components, hooks, pages – tracks, artists, auth, health
  components/   app shell, shared states (error, pagination, user text); ui/ = shadcn components
  pages/        route-level pages outside a feature (status)
  lib/          query client, formatting, auth wiring, countries
  stores/       zustand session store
  test/         MSW server and builders, render helpers, setup
nginx/          nginx config template and the shared security-headers snippet
public/fonts/   self-hosted Readex Pro (woff2 per script) and its license
specs/          spec, plan and tasks per feature
docs/           walkthrough (how the code works)
```
