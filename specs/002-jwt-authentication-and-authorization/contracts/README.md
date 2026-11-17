# Contracts (Phase 1)

- API: `../backend/specs/002-jwt-authentication-and-authorization/contracts/openapi.json`
  (types regenerated with `npm run gen:api`); reviewed intent in `auth-api.md` next to it:
  `POST /api/auth/login` → 200 `LoginResponse` | 400 | 401 generic | 429 + `Retry-After`;
  `GET /api/auth/me` (Bearer) → 200 `CurrentUserDto` | 401.
- UI routes: see `data-model.md` (Routes).
