# Quickstart: verify Phase 5 (web app)

1. Backend stack on a fresh database (`docker compose down -v && docker compose up -d --build` in the
   backend repo), then `docker compose up -d --build` here; open http://localhost:8081.
2. `curl -sI` on `/`, `/tracks/x`, `/assets/<js file>`, `/api/health`: one copy of each security header; CSP has no
   third-party host; `/api/health` carries the API's headers.
3. In the browser's network log, every request goes to `localhost:8081` (font included).
4. `npm audit --omit=dev` → 0; `npm audit` → only the accepted rows listed in the backend's `docs/security-review.md`.
5. End-to-end (Edge, desktop light + 400 px dark): visitor filters by status, genre and artist, opens a
   distributed track; admin signs in, adds an artist and a track, submits, distributes to two platforms,
   marks one live and one rejected, sends again, signs out. No overflow, no app console errors.
6. Clean clone in a new scratch folder: `npm ci && npm run lint && npm run typecheck && npx --no-install vitest run && npm run build`.
