import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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

/** Default handlers; tests override with server.use(...). */
export const handlers = [http.get(`*${API}/health`, () => HttpResponse.json(healthyReport))];

export const server = setupServer(...handlers);
