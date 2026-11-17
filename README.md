# Takwene Track Management – Web app

React single-page app for managing artists, tracks and their distribution to DSPs. It talks only
to the API in the backend repo:
[takwene-track-backend](https://github.com/yussifmohd/takwene-track-backend).

- Design decisions and AI usage (both repos): backend `DECISIONS.md` (Phase 5) and
  [backend docs/ai-log.md](https://github.com/yussifmohd/takwene-track-backend/blob/main/docs/ai-log.md)
- Specs per phase: [specs/](specs/)

> Status: Phase 0 – app shell and system status page. Tracks and artists arrive in later phases.

## Stack

React 19 + TypeScript 5.9 (strict) + Vite 8 · React Router 8 · TanStack Query (server state) ·
zustand (auth, from Phase 1) · shadcn/ui + Tailwind 4 · react-hook-form + zod (from Phase 1) ·
API types generated from the backend OpenAPI contract · Vitest + Testing Library + MSW.

## Prerequisites

- Docker Desktop, **or** Node 26.13.1 (`.nvmrc`) with npm.
- The backend running (see its README). The web app calls it on the same origin under `/api`.

## Run with Docker

Start the backend stack first (it creates the `trackmgmt-net` network and the `api` service):

```bash
cd ../backend && docker compose up -d --build
cd ../frontend && docker compose up --build
```

Open http://localhost:8081. nginx serves the app and proxies `/api/*` to `http://api:8080`
(override with `API_UPSTREAM`). If the API is down, the page still loads and shows
"Can't reach the server" with a Retry button.

## Run without Docker

```bash
npm ci
npm run dev        # http://localhost:5173, proxies /api to http://localhost:8080
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | type-check and production build to `dist/` |
| `npm test` | Vitest (watch); `npm test -- --run` for a single run |
| `npm run lint` / `npm run typecheck` | ESLint (no warnings allowed) / TypeScript |
| `npm run gen:api` | regenerate `src/api/schema.d.ts` from the backend contract |

### API types

`src/api/schema.d.ts` is generated from
`../backend/specs/<feature>/contracts/openapi.json` (expects the backend repo checked out next to
this one) and committed, so CI does not need the backend. Never edit it by hand; regenerate it
when the backend contract changes, and let the type errors show what changed.

## CI

`.github/workflows/frontend-ci.yml` runs on every pull request to `main`: `npm ci`, lint,
typecheck, tests, build and an initial-JS budget (< 250 kB gzip). To make it a merge gate:
**Settings → Branches → Add rule** for `main` → *Require status checks to pass* → `check`.

## Configuration

Only `VITE_API_BASE_URL` (default `/api`). Anything prefixed `VITE_` ends up in the public
bundle, so no secrets belong in `.env` files here.

## Sign-in and sessions

- Browsing is public. Sign in at `/login` with the admin account from the backend's `.env`
  (`ADMIN__EMAIL` / `ADMIN__PASSWORD`); there is no registration. The header shows **Sign in** or
  the signed-in email with **Sign out**.
- `/account` is protected: signed-out visitors are sent to `/login?redirect=/account` and come back
  after signing in. The return address must be a path on this site; anything else goes to `/`.
- Sessions last 60 minutes and are not renewed. The app signs out when the token expires (also
  checked when the tab regains focus), when the API answers `401`, and when you sign out in another
  tab. A toast says why.
- Error messages: wrong credentials show one generic message; too many attempts show how long to
  wait (`Retry-After`); an unreachable API says so.

**Token storage trade-off.** The session (token, expiry, email, roles) is kept in `localStorage`
under `trackmgmt.session`, so it survives reloads. Any script running on this origin could read it.
That risk is reduced by the strict CSP in the nginx config (no inline or third-party scripts),
rendering user text only as text (no `dangerouslySetInnerHTML`, enforced by lint), short-lived
tokens, and clearing storage on sign-out. An httpOnly cookie would avoid it but needs CSRF protection
and a cookie-issuing API; see the backend `DECISIONS.md`.

Code: `src/stores/authStore.ts` (session), `src/lib/authSetup.ts` (API client wiring, other tabs),
`src/features/auth` (login page, `RequireAuth` guard, account page, header menu, `SessionWatcher`).
New protected pages go under the `RequireAuth` route in `src/router.tsx`.

## Project structure

```text
src/
  api/          client.ts (fetch wrapper), problem.ts (ProblemDetails), schema.d.ts (generated), <feature>.ts
  features/     <feature>/components, hooks
  components/   app shell, shared states; ui/ = shadcn primitives
  pages/        route components
  lib/          query client, formatting, utils, auth wiring
  stores/       zustand stores (session)
  test/         MSW server, render helpers, setup
nginx/          nginx config template for the container
```
