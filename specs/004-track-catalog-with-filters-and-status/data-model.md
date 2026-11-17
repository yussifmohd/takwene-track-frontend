# Data Model: Track Catalog with Filters and Status (Web app)

Types come from the generated contract (`src/api/schema.d.ts`).

- `TrackListItem` = `components["schemas"]["TrackListItemDto"]`
- `TrackDetail` = `TrackDetailDto` (+ `allowedNextStatuses`, `distributions`)
- `TrackStatus` = `"draft" | "submitted" | "distributed"`; `Genre` = the 8 names (contract enums)
- `TrackFilters { status?: TrackStatus; genre?: Genre; artistId?: string; page: number }`
- `CreateTrackRequest { title, artistId, isrc, genre, releaseDate }` (all required)

## Form rules (same as the API)
| Field | Rule | Message |
|---|---|---|
| title | required, trimmed, ≤ 200 code points | "Enter the track title." / "Use at most 200 characters." |
| artistId | required | "Choose an artist." |
| isrc | required; ISO 3901 with or without hyphens | "Enter the ISRC." / "Enter the ISRC as CC-XXX-YY-NNNNN, e.g. EG-A1B-26-00001." |
| genre | one of the list | "Choose a genre." |
| releaseDate | required, real date, 1900–2100 | "Enter the release date." / "Enter a release date between 1900 and 2100." |

## Labels
- Status: draft "Draft", submitted "Submitted", distributed "Distributed".
- Actions: → submitted "Submit", → draft "Withdraw to draft", → distributed "Mark as distributed".
