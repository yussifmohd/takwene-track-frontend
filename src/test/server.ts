import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Artist, ArtistsPage } from "@/api/artists";
import type { CurrentUser, LoginResponse } from "@/api/auth";
import type { HealthReport } from "@/api/health";

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

/** Default handlers; tests override with server.use(...). */
export const handlers = [http.get(`*${API}/health`, () => HttpResponse.json(healthyReport))];

export const server = setupServer(...handlers);
