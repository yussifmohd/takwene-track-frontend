# Data Model: Admin Sign-in & Session (Web app)

## Session (zustand, persisted as `trackmgmt.session`, version 1)

| Field | Type | Source |
|---|---|---|
| accessToken | string | `LoginResponse.accessToken` |
| expiresAt | ISO date-time string | `LoginResponse.expiresAt` |
| email | string | `LoginResponse.user.email` |
| roles | string[] | `LoginResponse.user.roles` |

Derived: `isAuthenticated = session !== null && Date.parse(expiresAt) > Date.now()`;
`isAdmin = roles.includes("Admin")`. In-memory only: `signOutReason: "manual" | "expired" | "rejected" | null`.

## Server state (TanStack Query)

| Key | Source | Cleared on sign-out |
|---|---|---|
| `["auth","me"]` | `GET /api/auth/me` → `CurrentUserDto` | yes |
| `["health"]` | unchanged | no (public) |

## Routes

| Path | Access | Notes |
|---|---|---|
| `/` | public | status page |
| `/login` | public; signed-in → `/` | `?redirect=` safe path |
| `/account` | RequireAuth | `handle.requiresAuth = true` |
| `*` | public | not found |
