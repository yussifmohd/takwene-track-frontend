# Research: Foundation & Architecture (Web app)

Versions checked on 2026-11-17 against registry.npmjs.org / Docker Hub. Rule: newest stable
release **at least two weeks old** (published on or before 2026-11-03) whose peer ranges are
mutually compatible; permissive licenses only (MIT / Apache-2.0 / ISC).

## R1. Runtime

- **Decision**: Node `26.13.1` (installed locally) in `.nvmrc`; `package.json` `"engines": { "node": ">=26.13.1 <27" }`;
  npm lockfile committed; CI uses `actions/setup-node` with `node-version-file: .nvmrc`.
- **Fallback**: switch to Node 24 LTS if any dependency fails on 26 (none of the engines ranges
  below exclude 26: jsdom `>=26.0.0`, vitest `>=26.0.0`, react-router `>=22.22.0`).

## R2. Dependency pins (installed with `npm i -E`)

| Package | Version | License | Published | Notes |
|---|---|---|---|---|
| react / react-dom | 19.3.1 | MIT | 2026-10-14 | |
| react-router | 8.5.1 | MIT | 2026-10-27 | data router (`createBrowserRouter`) |
| @tanstack/react-query | 5.105.3 | MIT | 2026-11-02 | |
| zustand | 5.0.16 | MIT | 2026-10-22 | used from Phase 1 (auth) |
| react-hook-form | 7.91.0 | MIT | 2026-10-23 | used from Phase 1 |
| zod | 4.6.7 | MIT | 2026-10-12 | |
| @hookform/resolvers | 7.0.1 | MIT | 2026-11-01 | |
| tailwindcss / @tailwindcss/vite | 4.3.4 | MIT | 2026-11-02 | |
| shadcn (CLI, dev) | 4.23.0 | MIT | 2026-10-27 | `npx shadcn@4.23.0 init/add` |
| radix-ui | 1.8.1 | MIT | 2026-10-12 | pulled by shadcn components |
| class-variance-authority | 0.7.1 | Apache-2.0 | 2024-11-26 | |
| clsx | 2.1.1 | MIT | 2024-04-23 | |
| tailwind-merge | 3.7.0 | MIT | 2026-09-12 | |
| tw-animate-css | 1.4.0 | MIT | 2025-09-24 | |
| lucide-react | 1.66.0 | ISC | 2026-10-31 | icons |
| sonner | 2.0.8 | MIT | 2026-08-09 | toasts (shadcn) |
| vite | 8.3.5 | MIT | 2026-10-21 | |
| @vitejs/plugin-react | 6.2.1 | MIT | 2026-11-02 | |
| typescript | **5.9.3** | Apache-2.0 | 2025-09-30 | 7.x/6.x rejected: typescript-eslint needs `<6.1.0`, openapi-typescript and msw need `^5` / `>=5.9` |
| openapi-typescript | 7.13.0 | MIT | 2026-02-11 | generates `src/api/schema.d.ts` |
| vitest | 5.1.0 | MIT | 2026-11-02 | |
| jsdom | 30.1.3 | MIT | 2026-10-15 | |
| @testing-library/react | 16.3.3 | MIT | 2026-08-27 | |
| @testing-library/dom | 10.4.2 | MIT | 2026-09-13 | RTL peer |
| globals | 17.14.0 | MIT | 2026-11-01 | ESLint browser/node globals |
| @testing-library/user-event | 14.6.8 | MIT | 2026-10-13 | |
| @testing-library/jest-dom | 7.0.1 | MIT | 2026-08-09 | |
| msw | 3.0.3 | MIT | 2026-10-10 | HTTP mocking in tests |
| eslint | 10.14.0 | MIT | 2026-10-30 | flat config |
| @eslint/js | 10.0.1 | MIT | 2026-02-06 | |
| typescript-eslint | 8.72.1 | MIT | 2026-10-26 | |
| eslint-plugin-react-hooks | 7.1.1 | MIT | 2026-04-17 | |
| @types/react / @types/react-dom | 19.3.0 | MIT | 2026-09-09 | |
| @types/node | 26.6.6 | MIT | 2026-10-28 | |

Exact transitive versions are fixed by `package-lock.json`.

## R3. API types from the backend contract

- **Decision**: `npm run gen:api` = `openapi-typescript ../backend/specs/<feature>/contracts/openapi.json -o src/api/schema.d.ts`.
  The generated file is committed (CI has no backend checkout). Feature API modules use
  `components["schemas"]["HealthReportDto"]` etc. A header comment records the source contract.
- **Alternatives**: `openapi-fetch` client (extra dependency for little gain over a 60-line
  fetch wrapper); hand-written types (drift risk, violates Principle I).

## R4. API client & ProblemDetails

- **Decision**: `src/api/client.ts` – `apiFetch<T>(path, { method, body, signal, acceptStatuses })`
  with base `import.meta.env.VITE_API_BASE_URL ?? "/api"`, JSON handling, optional bearer token
  via a registered `getAccessToken()` provider (wired to the auth store in Phase 1) and an
  `onUnauthorized` hook (Phase 1). Non-accepted statuses throw `ApiError { status, problem }`
  where `problem` is parsed `application/problem+json` (fallback synthesised from status text).
  `toast` helper `showProblemToast(error)` maps to sonner. `acceptStatuses: [503]` lets the health
  call read the 503 body as data.

## R5. Health status UX

- **Decision**: `useHealthQuery()` → `useQuery({ queryKey: ["health"], queryFn, refetchInterval: 30_000,
  refetchIntervalInBackground: false, retry: 1 })`. States: Skeleton card (loading) → healthy
  (green badge, database check, "checked hh:mm:ss") → unhealthy (503 body: destructive badge,
  failing check) → unreachable (network/5xx error: ErrorState + Retry → `refetch()`).
- Visual direction via the **frontend-design** skill (applied during implementation).

## R6. Routing & shell

- **Decision**: `createBrowserRouter` with layout route `AppShell` (header: product name, nav links
  Tracks/Artists rendered as disabled "coming soon" until their phases, status slot), index route
  `HomePage` (health card), `*` → `NotFoundPage`. `dir="auto"` utility for user text (Q5).

## R7. Local dev & containers

- **Decision**: Vite dev server port 5173, `server.proxy["/api"] = "http://localhost:8080"`.
  Docker: build stage `node:26.13.1-alpine` (`npm ci`, `npm run build`), runtime
  `nginxinc/nginx-unprivileged:1.30.6-alpine` (non-root, uid 101) listening on **8081**;
  `nginx.conf` template: SPA fallback `try_files $uri $uri/ /index.html`, `location /api/`
  → `proxy_pass ${API_UPSTREAM}` (default `http://api:8080`) using Docker DNS `resolver 127.0.0.11`
  and a variable upstream so nginx starts even if the API is down; long-cache hashed assets,
  no-cache `index.html`, basic security headers. Compose: service `web`, `8081:8081`, network
  `trackmgmt-net` (`external: true`), healthcheck `wget -qO- http://localhost:8081/`.

## R8. CI

- **Decision**: `.github/workflows/frontend-ci.yml` on `pull_request` to main: checkout,
  setup-node (.nvmrc, npm cache), `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --run`,
  `npm run build`.

## R8b. Implementation notes

- shadcn `add` without `init` injected unpinned `cn` and `next-themes` and imported `cn` from the
  `cn` package; both removed, imports pointed at `@/lib/utils`, Toaster uses `theme="system"`.
- MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`.
- Dev-only audit finding (minimatch ReDoS via eslint/typescript-eslint/ts-morph/redocly) accepted:
  build tooling with our own glob patterns; production dependencies audit clean.

## R9. Testing

- **Decision**: Vitest (jsdom) + RTL + user-event + jest-dom matchers; MSW node server in
  `src/test/setup.ts` with per-test handlers; `renderWithProviders` (fresh QueryClient with
  `retry: false`, MemoryRouter). Tests: HealthCard (loading skeleton, healthy, unhealthy 503,
  unreachable + retry), `apiFetch` ProblemDetails parsing, NotFound route.
