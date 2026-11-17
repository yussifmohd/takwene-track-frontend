import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Artist, ArtistsPage } from "@/api/artists";
import type { CurrentUser, LoginResponse } from "@/api/auth";
import type { HealthReport } from "@/api/health";
import type { TrackDetail, TrackListItem, TracksPage } from "@/api/tracks";

export const API = "/api";

export const healthyReport: HealthReport = {
  status: "healthy",
  checkedAt: "2026-11-17T10:15:30Z",
  checks: [{ name: "database", status: "healthy", durationMs: 12.4 }],
};

export const unhealthyReport: HealthReport = {
  status: "unhealthy",
  checkedAt: "2026-11-17T10:16:00Z",
  checks: [{ name: "database", status: "unhealthy", durationMs: 3004 }],
};

export const ADMIN_EMAIL = "admin@takwene.local";
export const ADMIN_PASSWORD = "Adm1n!Passw0rd#2026";

export function loginResponse(minutes = 60): LoginResponse {
  const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
  return { accessToken: "jwt-from-server", tokenType: "Bearer", expiresAt, user: { email: ADMIN_EMAIL, roles: ["Admin"], expiresAt } };
}

export function currentUser(minutes = 52): CurrentUser {
  return { email: ADMIN_EMAIL, roles: ["Admin"], expiresAt: new Date(Date.now() + minutes * 60_000).toISOString() };
}

export function problem(status: number, body: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return HttpResponse.json({ status, ...body }, { status, headers: { "Content-Type": "application/problem+json", ...headers } });
}

/** Artists as an admin sees them (with emails); `artistsHandler` strips emails for other callers. */
export const sampleArtists: Artist[] = [
  { id: "a1", name: "Amr Diab", countryCode: "EG", email: "amr@example.com", createdAtUtc: "2026-11-17T09:00:00Z" },
  { id: "a2", name: "Nancy عجرم", countryCode: "LB", email: "nancy@example.com", createdAtUtc: "2026-11-17T09:05:00Z" },
  { id: "a3", name: "عمرو دياب", countryCode: "EG", email: "booking@example.com", createdAtUtc: "2026-11-17T09:10:00Z" },
];

/** `GET /api/artists` like the API: paged, emails only with an Authorization header. */
export function artistsHandler(all: Artist[] = sampleArtists, options: { requests?: URL[] } = {}) {
  return http.get(`*${API}/artists`, ({ request }) => {
    const url = new URL(request.url);
    options.requests?.push(url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    const admin = request.headers.has("authorization");
    const items = all
      .slice((page - 1) * pageSize, page * pageSize)
      .map((artist) => (admin ? artist : { ...artist, email: undefined }));
    const body: ArtistsPage = { items, page, pageSize, totalCount: all.length, totalPages: Math.ceil(all.length / pageSize) };
    return HttpResponse.json(body);
  });
}

export const ARTIST_ID = "6f1c2b0e-8a7d-4c1e-9f3a-2b5d7e9a1c01";
export const TRACK_ID = "0b7e4d2a-3c1f-4e8b-9a6d-5f2c1e7b9d10";

/** Tracks as the API lists them (newest release first). */
export const sampleTracks: TrackListItem[] = [
  { id: TRACK_ID, title: "Tamally Maak", artistId: ARTIST_ID, artistName: "Amr Diab", isrc: "EG-A1B-26-00001", genre: "Arabic Pop", status: "submitted", releaseDate: "2026-12-01" },
  { id: "1c8f5e3b-4d2a-4f9c-8b7e-6a3d2f8c0e21", title: "سهران", artistId: ARTIST_ID, artistName: "عمرو دياب", isrc: "EG-A1B-26-00002", genre: "Khaleeji", status: "draft", releaseDate: "2026-06-15" },
  { id: "2d9a6f4c-5e3b-4a0d-9c8f-7b4e3a9d1f32", title: "Mahragan El Nour", artistId: ARTIST_ID, artistName: "Wegz", isrc: "EG-W3G-25-00410", genre: "Mahraganat", status: "distributed", releaseDate: "2025-03-01" },
];

export function trackDetail(overrides: Partial<TrackDetail> = {}): TrackDetail {
  const status = overrides.status ?? "submitted";
  const allowed: Record<string, TrackDetail["allowedNextStatuses"]> = {
    draft: ["submitted"],
    submitted: ["draft", "distributed"],
    distributed: [],
  };
  return {
    ...sampleTracks[0]!,
    createdAtUtc: "2026-11-17T09:00:00Z",
    updatedAtUtc: null,
    allowedNextStatuses: allowed[status]!,
    distributions: [],
    ...overrides,
    status,
  };
}

/** `GET /api/tracks` like the API: filters and paging applied to `all`. */
export function tracksHandler(all: TrackListItem[] = sampleTracks, options: { requests?: URL[] } = {}) {
  return http.get(`*${API}/tracks`, ({ request }) => {
    const url = new URL(request.url);
    options.requests?.push(url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    const status = url.searchParams.get("status");
    const genre = url.searchParams.get("genre");
    const artistId = url.searchParams.get("artistId");
    const matching = all.filter(
      (t) => (!status || t.status === status) && (!genre || t.genre === genre) && (!artistId || t.artistId === artistId),
    );
    const body: TracksPage = {
      items: matching.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalCount: matching.length,
      totalPages: Math.ceil(matching.length / pageSize),
    };
    return HttpResponse.json(body);
  });
}

/** Default handlers; tests override with server.use(...). */
export const handlers = [http.get(`*${API}/health`, () => HttpResponse.json(healthyReport)), tracksHandler()];

export const server = setupServer(...handlers);
