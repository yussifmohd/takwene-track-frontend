# Data Model: Artists (Web app)

## Server state (TanStack Query)

| Key | Source | Notes |
|---|---|---|
| `["artists","list",{ page, pageSize }]` | `GET /api/artists` → `PagedResult<ArtistDto>` | `keepPreviousData`; invalidated after create; removed on sign-out |
| `["auth", …]`, `["health"]` | unchanged | |

## Types (generated from the contract)

- `ArtistDto { id, name, countryCode, email?, createdAtUtc }`
- `ArtistDtoPagedResult { items, page, pageSize, totalCount, totalPages }` (name as generated)
- `CreateArtistRequest { name, countryCode, email }` (all required)

## Form model (zod)

| Field | Rule |
|---|---|
| name | trimmed, 1–200 code points, "Enter the artist's name." |
| countryCode | one of the 249 codes, "Choose a country." |
| email | required ("Enter the artist's email."), trimmed, ≤ 254, valid format |

## Routes

| Path | Access | Notes |
|---|---|---|
| `/artists` | public | `?page=N` |
| `/artists/new` | RequireAuth, role Admin | non-admin → "Only admins can add artists" |
