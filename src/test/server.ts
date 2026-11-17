import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Artist, ArtistsPage } from "@/api/artists";
import type { CurrentUser, LoginResponse } from "@/api/auth";
import type { HealthReport } from "@/api/health";
import type { Dsp } from "@/api/dsps";
import type { TrackDetail, TrackDistribution, TrackListItem, TracksPage } from "@/api/tracks";

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
    const search = url.searchParams.get("search")?.toLowerCase();
    const matching = search ? all.filter((artist) => artist.name.toLowerCase().includes(search)) : all;
    const items = matching
      .slice((page - 1) * pageSize, page * pageSize)
      .map((artist) => (admin ? artist : { ...artist, email: undefined }));
    const body: ArtistsPage = { items, page, pageSize, totalCount: matching.length, totalPages: Math.ceil(matching.length / pageSize) };
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

export const DSPS: Dsp[] = [
  { id: "0d1f6b9e-5c2a-4c7e-9f4b-2b8a7c1e0002", name: "Apple Music" },
  { id: "0d1f6b9e-5c2a-4c7e-9f4b-2b8a7c1e0001", name: "Spotify" },
  { id: "0d1f6b9e-5c2a-4c7e-9f4b-2b8a7c1e0003", name: "YouTube Music" },
];
export const [APPLE, SPOTIFY, YOUTUBE] = DSPS.map((d) => d.id) as [string, string, string];

/** A delivery as the API returns it (`allowedAnswers` only while pending). */
export function delivery(dspId: string, status: TrackDistribution["status"] = "pending", overrides: Partial<TrackDistribution> = {}): TrackDistribution {
  return {
    dspId,
    dspName: DSPS.find((d) => d.id === dspId)?.name ?? "Unknown",
    status,
    submittedAtUtc: "2026-11-17T10:00:00Z",
    answeredAtUtc: status === "pending" ? null : "2026-11-17T11:30:00Z",
    allowedAnswers: status === "pending" ? ["live", "rejected"] : [],
    ...overrides,
  };
}

/** A track detail shaped by the API's rules: allowed next statuses, `canDistribute`, deliveries by name. */
export function trackDetail(overrides: Partial<TrackDetail> = {}): TrackDetail {
  const status = overrides.status ?? "submitted";
  const distributions = [...(overrides.distributions ?? [])].sort((x, y) => x.dspName.localeCompare(y.dspName));
  const allowed: Record<string, TrackDetail["allowedNextStatuses"]> = {
    draft: ["submitted"],
    submitted: distributions.length > 0 ? ["draft", "distributed"] : ["draft"],
    distributed: [],
  };
  return {
    ...sampleTracks[0]!,
    createdAtUtc: "2026-11-17T09:00:00Z",
    updatedAtUtc: null,
    allowedNextStatuses: allowed[status]!,
    canDistribute: status !== "draft",
    ...overrides,
    distributions,
    status,
  };
}

export const dspsHandler = (dsps: Dsp[] = DSPS) => http.get(`*${API}/dsps`, () => HttpResponse.json(dsps));

/**
 * One track served like the API: GET, status PATCH, distribute and answers, applying the API's rules
 * (refusals → 409 with the API's message). Returns the requests it received and a way to replace the state.
 */
export function serveTrack(initial: TrackDetail, options: { delayMs?: number } = {}) {
  let current = initial;
  const calls = { patches: [] as string[], distributes: [] as string[][], answers: [] as { dspId: string; status: string }[] };
  const now = "2026-11-17T12:00:00Z";
  const conflict = (detail: string) => problem(409, { title: "Conflict", detail });
  // Recompute what the API derives (allowed next statuses, canDistribute) from the new state.
  const rebuild = ({ allowedNextStatuses: _allowed, canDistribute: _can, ...rest }: TrackDetail) => trackDetail(rest);
  server.use(
    http.get(`*${API}/tracks/:id`, () => HttpResponse.json(current)),
    http.patch(`*${API}/tracks/:id/status`, async ({ request }) => {
      const { status } = (await request.json()) as { status: TrackDetail["status"] };
      calls.patches.push(status);
      await delay(options.delayMs ?? 30);
      if (!current.allowedNextStatuses.includes(status)) return conflict(`The track cannot change to ${status}.`);
      current = rebuild({ ...current, status, updatedAtUtc: now });
      return HttpResponse.json(current);
    }),
    http.post(`*${API}/tracks/:id/distribute`, async ({ request }) => {
      const { dspIds } = (await request.json()) as { dspIds: string[] };
      calls.distributes.push(dspIds);
      await delay(options.delayMs ?? 30);
      if (!current.canDistribute) return conflict("A draft track must be submitted before it can be distributed.");
      const rows = new Map(current.distributions.map((d) => [d.dspId, d]));
      let changed = false;
      for (const id of new Set(dspIds)) {
        const row = rows.get(id);
        if (!row || row.status === "rejected") {
          rows.set(id, delivery(id, "pending", { submittedAtUtc: now }));
          changed = true;
        }
      }
      if (changed) current = rebuild({ ...current, status: "distributed", updatedAtUtc: now, distributions: [...rows.values()] });
      return HttpResponse.json(current);
    }),
    http.patch(`*${API}/tracks/:id/distributions/:dspId`, async ({ request, params }) => {
      const { status } = (await request.json()) as { status: "live" | "rejected" };
      const dspId = String(params.dspId);
      calls.answers.push({ dspId, status });
      await delay(options.delayMs ?? 30);
      const row = current.distributions.find((d) => d.dspId === dspId);
      if (!row) return problem(404, { title: "Resource not found", detail: "This track has not been sent to this platform." });
      if (row.status !== "pending") return conflict(`The delivery is already ${row.status}.`);
      current = rebuild({
        ...current,
        updatedAtUtc: now,
        distributions: current.distributions.map((d) => (d.dspId === dspId ? delivery(dspId, status, { submittedAtUtc: d.submittedAtUtc, answeredAtUtc: now }) : d)),
      });
      return HttpResponse.json(current);
    }),
  );
  return { calls, get: () => current, set: (next: TrackDetail) => (current = next) };
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
export const handlers = [http.get(`*${API}/health`, () => HttpResponse.json(healthyReport)), tracksHandler(), dspsHandler()];

export const server = setupServer(...handlers);
