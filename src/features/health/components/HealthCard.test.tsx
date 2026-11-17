import { screen, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { healthyReport, server, unhealthyReport } from "@/test/server";
import { HealthCard } from "./HealthCard";

describe("HealthCard", () => {
  it("shows a skeleton while the first check is running", async () => {
    server.use(http.get("*/api/health", async () => { await delay("infinite"); return HttpResponse.json(healthyReport); }));

    renderWithProviders(<HealthCard />);

    expect(await screen.findByTestId("health-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Checking system status")).toBeInTheDocument();
  });

  it("shows a healthy report with the database check and last-checked time", async () => {
    renderWithProviders(<HealthCard />);

    expect(await screen.findByRole("heading", { name: "Everything is running" })).toBeInTheDocument();
    const checks = screen.getByRole("list", { name: "Checks" });
    expect(within(checks).getByText("Database")).toBeInTheDocument();
    expect(within(checks).getByText("Healthy")).toBeInTheDocument();
    expect(within(checks).getByText("12 ms")).toBeInTheDocument();
    expect(screen.getByText(/Checked at/)).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute("dateTime", healthyReport.checkedAt);
  });

  it("shows an unhealthy report from a 503 response as data, not an error", async () => {
    server.use(http.get("*/api/health", () => HttpResponse.json(unhealthyReport, { status: 503 })));

    renderWithProviders(<HealthCard />);

    expect(await screen.findByRole("heading", { name: "Service unavailable" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Checks" })).getByText("Unhealthy")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error with Retry when the API is unreachable, and recovers on retry", async () => {
    // The query retries once, so fail the first two attempts.
    let attempts = 0;
    server.use(http.get("*/api/health", () => (++attempts <= 2 ? HttpResponse.error() : HttpResponse.json(healthyReport))));
    const { user } = renderWithProviders(<HealthCard />);

    // The error shows after the query's single retry (about 1 s backoff).
    const alert = await screen.findByRole("alert", {}, { timeout: 4000 });
    expect(within(alert).getByText("Can't reach the server")).toBeInTheDocument();

    await user.click(within(alert).getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Everything is running" })).toBeInTheDocument();
  });
});
