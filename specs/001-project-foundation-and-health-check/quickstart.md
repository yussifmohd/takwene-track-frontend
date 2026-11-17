# Quickstart: Foundation & Architecture (Web app)

## Prerequisites
Node 26.13.1 (`.nvmrc`), Docker Desktop, the backend stack running (`docker compose up -d` in `backend/`).

## US2 – Run in Docker (one command)
```powershell
cd frontend
Copy-Item .env.example .env
docker compose up -d --build
start http://localhost:8081          # health card shows "healthy"
```
Deep link check: open http://localhost:8081/some/deep/link → app loads and shows Not found (no nginx 404).

## US2 – Run without Docker
```powershell
npm ci
npm run dev                           # http://localhost:5173, /api proxied to http://localhost:8080
```

## US1 – Health states
1. Backend up → healthy badge, database check listed, "Last checked" time; refreshes every 30 s.
2. `docker compose stop db` (backend) → within 30 s card shows Unhealthy (database failing).
3. `docker compose stop api` (backend) → Unreachable error state; click Retry after `docker compose start api` → healthy.

## US4 – Shell
Header with product name, Tracks/Artists "coming soon"; `/nope` → Not found with "Back home".

## US3 – CI
Open a PR to main → `frontend-ci` runs lint, typecheck, tests, build.

## Local checks
```powershell
npm run lint; npm run typecheck; npm test -- --run; npm run build
```
