# Contracts (Phase 2)

- API: `../backend/specs/003-artists-and-dsps-management/contracts/openapi.json` (types regenerated
  with `npm run gen:api`); reviewed intent in `artists-api.md` next to it:
  `GET /api/artists?page&pageSize` → paged `ArtistDto` (email only for admins) | 400;
  `POST /api/artists` (Bearer, Admin) → 201 `ArtistDto` | 400 / 409 with `errors.{name,countryCode,email}` | 401 | 403 | 413;
  `GET /api/dsps` → `DspDto[]` (not used by the UI in this phase).
- UI routes: see `data-model.md` (Routes).
