import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
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

/** Default handlers; tests override with server.use(...). */
export const handlers = [http.get(`*${API}/health`, () => HttpResponse.json(healthyReport))];

export const server = setupServer(...handlers);
