import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { renderRoutes } from "@/test/render";
import { healthyReport, problem, server, unhealthyReport } from "@/test/server";

describe("StatusDot", () => {
  it("says the service is healthy and links to the status page", async () => {
    const { user, router } = renderRoutes(routes, { route: "/" });
    const dot = await screen.findByRole("link", { name: "Service status: healthy" });
    expect(dot).toHaveAttribute("href", "/status");
    expect(dot).toHaveAttribute("title", "Service status: healthy");
    expect(dot).toHaveAttribute("data-state", "healthy");

    await user.click(dot);
    expect(router.state.location.pathname).toBe("/status");
    expect(await screen.findByRole("heading", { name: "System status" })).toBeInTheDocument();
  });

  it.each([
    ["degraded", "degraded", HttpResponse.json({ ...healthyReport, status: "degraded" })],
    ["unavailable", "unhealthy", HttpResponse.json(unhealthyReport, { status: 503 })],
    ["unreachable", "unreachable", problem(502, { title: "Bad Gateway" })],
  ] as const)("reads %s when the API says so", async (label, state, response) => {
    server.use(http.get("*/api/health", () => response.clone()));
    renderRoutes(routes, { route: "/" });
    expect(await screen.findByRole("link", { name: `Service status: ${label}` }, { timeout: 3000 })).toHaveAttribute("data-state", state);
  });
});
