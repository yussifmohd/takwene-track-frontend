import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import type { TrackDetail } from "@/api/tracks";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { problem, server, TRACK_ID, trackDetail } from "@/test/server";
import { signInForTest } from "@/test/session";

const route = `/tracks/${TRACK_ID}`;

function serveTrack(initial: TrackDetail) {
  let current = initial;
  const patches: string[] = [];
  server.use(
    http.get("*/api/tracks/:id", () => HttpResponse.json(current)),
    http.patch("*/api/tracks/:id/status", async ({ request }) => {
      const { status } = (await request.json()) as { status: TrackDetail["status"] };
      patches.push(status);
      await delay(30);
      current = trackDetail({ status, updatedAtUtc: "2026-11-17T12:00:00Z" });
      return HttpResponse.json(current);
    }),
  );
  return { patches, set: (next: TrackDetail) => (current = next) };
}

const statusGroup = () => screen.getByRole("group", { name: "Change status" });

describe("TrackDetailPage", () => {
  it("shows a placeholder, then the track's facts, without a status control for visitors", async () => {
    serveTrack(trackDetail({ title: "سهران", artistName: "عمرو دياب" }));
    renderRoutes(routes, { route });

    expect(screen.getByRole("status")).toHaveTextContent("Loading track");
    const heading = await screen.findByRole("heading", { level: 1, name: "سهران" });
    expect(within(heading).getByText("سهران")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("عمرو دياب")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("EG-A1B-26-00001")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("Arabic Pop")).toBeInTheDocument();
    expect(screen.getByText("1 Dec 2026")).toBeInTheDocument();
    expect(screen.getByText("Not changed yet")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Change status" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All tracks" })).toHaveAttribute("href", "/");
  });

  it.each([
    ["draft", "Not sent to any platform yet."],
    ["submitted", "Not sent to any platform yet."],
    ["distributed", "Marked as distributed without platform deliveries recorded."],
  ] as const)("explains empty distributions for a %s track", async (status, text) => {
    serveTrack(trackDetail({ status }));
    renderRoutes(routes, { route });
    const section = await screen.findByRole("region", { name: "Distributions" });
    expect(within(section).getByText(text)).toBeInTheDocument();
  });

  it("says when the track does not exist", async () => {
    server.use(http.get("*/api/tracks/:id", () => problem(404, { title: "Not Found", detail: "No track has this id." })));
    renderRoutes(routes, { route });
    expect(await screen.findByRole("heading", { name: "Track not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the catalogue" })).toHaveAttribute("href", "/");
  });

  it("shows other errors with Retry", async () => {
    server.use(http.get("*/api/tracks/:id", () => problem(500, { title: "Server error" })));
    renderRoutes(routes, { route });
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("offers an admin only the allowed next statuses and submits a draft", async () => {
    signInForTest();
    const { patches } = serveTrack(trackDetail({ status: "draft" }));
    const success = vi.spyOn(toast, "success");
    const { user } = renderRoutes(routes, { route });

    await screen.findByRole("group", { name: "Change status" });
    expect(within(statusGroup()).getAllByRole("button").map((b) => b.textContent)).toEqual(["Submit"]);

    await user.click(within(statusGroup()).getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(within(statusGroup()).getAllByRole("button").map((b) => b.textContent)).toEqual(["Withdraw to draft", "Mark as distributed"]));
    expect(patches).toEqual(["submitted"]);
    expect(success).toHaveBeenCalledWith("Track submitted", expect.anything());
    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });

  it("asks before marking as distributed; Cancel sends nothing, confirming makes it final", async () => {
    signInForTest();
    const { patches } = serveTrack(trackDetail({ status: "submitted" }));
    const { user } = renderRoutes(routes, { route });
    await screen.findByRole("group", { name: "Change status" });

    await user.click(within(statusGroup()).getByRole("button", { name: "Mark as distributed" }));
    let dialog = await screen.findByRole("alertdialog", { name: "Mark as distributed?" });
    expect(dialog).toHaveTextContent("Distributed is final. The status can't change after this.");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(patches).toEqual([]);

    await user.click(within(statusGroup()).getByRole("button", { name: "Mark as distributed" }));
    dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Mark as distributed" }));

    expect(await screen.findByText("Distributed is final. The status can't change any more.")).toBeInTheDocument();
    expect(patches).toEqual(["distributed"]);
    expect(screen.getByText("Marked as distributed without platform deliveries recorded.")).toBeInTheDocument();
  });

  it("on a conflict (someone else changed it) shows the reason and the current status", async () => {
    signInForTest();
    const track = serveTrack(trackDetail({ status: "submitted" }));
    server.use(
      http.patch("*/api/tracks/:id/status", () => {
        track.set(trackDetail({ status: "draft" }));
        return problem(409, { title: "Conflict", detail: "The track is already draft." });
      }),
    );
    const error = vi.spyOn(toast, "error");
    const { user } = renderRoutes(routes, { route });
    await screen.findByRole("group", { name: "Change status" });

    await user.click(within(statusGroup()).getByRole("button", { name: "Withdraw to draft" }));

    await waitFor(() => expect(error).toHaveBeenCalledWith("Status not changed", { description: "The track is already draft." }));
    await waitFor(() => expect(within(statusGroup()).getAllByRole("button").map((b) => b.textContent)).toEqual(["Submit"]));
  });

  it("a rejected session (401) signs out with the Phase 1 message and returns here after sign-in", async () => {
    const cleanup = setupAuth(window);
    signInForTest();
    serveTrack(trackDetail({ status: "draft" }));
    server.use(http.patch("*/api/tracks/:id/status", () => problem(401, { title: "Unauthorized" })));
    const { user, router } = renderRoutes(routes, { route });
    await screen.findByRole("group", { name: "Change status" });

    await user.click(within(statusGroup()).getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe(`?redirect=${encodeURIComponent(route)}`);
    expect(useAuthStore.getState().session).toBeNull();
    expect(await screen.findByRole("status")).toHaveTextContent("Your session is no longer valid.");
    cleanup();
  });
});
