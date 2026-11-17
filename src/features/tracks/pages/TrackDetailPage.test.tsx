import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { APPLE, delivery, problem, server, serveTrack, SPOTIFY, TRACK_ID, trackDetail, YOUTUBE } from "@/test/server";
import { signInForTest } from "@/test/session";

const route = `/tracks/${TRACK_ID}`;

const statusGroup = () => screen.getByRole("group", { name: "Change status" });
const rows = () => within(screen.getByRole("table", { name: "Platform deliveries" })).getAllByRole("row").slice(1);
const rowFor = (name: string) => rows().find((row) => within(row).queryByText(name))!;

describe("TrackDetailPage", () => {
  it("shows a placeholder, then the track's facts, without admin controls for visitors", async () => {
    serveTrack(trackDetail({ title: "سهران", artistName: "عمرو دياب", status: "distributed", distributions: [delivery(SPOTIFY)] }));
    renderRoutes(routes, { route });

    expect(screen.getByRole("status")).toHaveTextContent("Loading track");
    const heading = await screen.findByRole("heading", { level: 1, name: "سهران" });
    expect(within(heading).getByText("سهران")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("عمرو دياب")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("EG-A1B-26-00001")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("Arabic Pop")).toBeInTheDocument();
    expect(screen.getByText("1 Dec 2026")).toBeInTheDocument();
    expect(screen.getByText("Not changed yet")).toBeInTheDocument();
    expect(screen.getByText("Distributed")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Change status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Distribute" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark (live|rejected)/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Platform answers are simulated.")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All tracks" })).toHaveAttribute("href", "/");
  });

  it("lists deliveries in the API's order with status words, sent time and answer time", async () => {
    serveTrack(
      trackDetail({
        status: "distributed",
        distributions: [
          delivery(SPOTIFY, "live", { submittedAtUtc: "2026-11-17T10:00:00Z", answeredAtUtc: "2026-11-17T11:30:00Z" }),
          delivery(APPLE, "pending", { submittedAtUtc: "2026-11-16T08:05:00Z" }),
          delivery(YOUTUBE, "rejected"),
        ],
      }),
    );
    renderRoutes(routes, { route });
    await screen.findByRole("table", { name: "Platform deliveries" });

    expect(rows().map((row) => within(row).getAllByRole("cell")[0]!.textContent)).toEqual(["Apple Music", "Spotify", "YouTube Music"]);
    const apple = rowFor("Apple Music");
    expect(within(apple).getByText("Pending")).toBeInTheDocument();
    expect(within(apple).getByText("Waiting")).toBeInTheDocument();
    expect(within(apple).getByText("Apple Music")).toHaveAttribute("dir", "auto");
    const spotify = rowFor("Spotify");
    expect(within(spotify).getByText("Live")).toBeInTheDocument();
    const times = within(spotify).getAllByText((_, el) => el?.tagName === "TIME");
    expect(times.map((t) => t.getAttribute("datetime"))).toEqual(["2026-11-17T10:00:00Z", "2026-11-17T11:30:00Z"]);
    expect(within(rowFor("YouTube Music")).getByText("Rejected")).toBeInTheDocument();
    expect(screen.queryByText(/without platform deliveries/)).not.toBeInTheDocument();
  });

  it.each(["draft", "submitted"] as const)("says a %s track was not sent anywhere yet", async (status) => {
    serveTrack(trackDetail({ status }));
    renderRoutes(routes, { route });
    const section = await screen.findByRole("region", { name: "Distributions" });
    expect(within(section).getByText("Not sent to any platform yet.")).toBeInTheDocument();
    expect(screen.queryByText(/without platform deliveries/)).not.toBeInTheDocument();
  });

  it("the placeholder includes the deliveries section", () => {
    serveTrack(trackDetail());
    const { container } = renderRoutes(routes, { route });
    expect(container.querySelector("[data-skeleton='distributions']")).not.toBeNull();
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

  describe("status control (admin)", () => {
    it("offers only the allowed next statuses and submits a draft", async () => {
      signInForTest();
      const { calls } = serveTrack(trackDetail({ status: "draft" }));
      const success = vi.spyOn(toast, "success");
      const { user } = renderRoutes(routes, { route });

      await screen.findByRole("group", { name: "Change status" });
      expect(within(statusGroup()).getAllByRole("button").map((b) => b.textContent)).toEqual(["Submit"]);
      expect(screen.queryByRole("button", { name: "Distribute" })).not.toBeInTheDocument();

      await user.click(within(statusGroup()).getByRole("button", { name: "Submit" }));
      await waitFor(() => expect(within(statusGroup()).getAllByRole("button").map((b) => b.textContent)).toEqual(["Withdraw to draft"]));
      expect(calls.patches).toEqual(["submitted"]);
      expect(success).toHaveBeenCalledWith("Track submitted", expect.anything());
      expect(screen.getByRole("button", { name: "Distribute" })).toBeEnabled();
    });

    it("never offers 'Mark as distributed', even if the API listed it", async () => {
      signInForTest();
      serveTrack(trackDetail({ status: "submitted", allowedNextStatuses: ["draft", "distributed"] }));
      renderRoutes(routes, { route });
      await screen.findByRole("group", { name: "Change status" });
      expect(within(statusGroup()).getAllByRole("button").map((b) => b.textContent)).toEqual(["Withdraw to draft"]);
      expect(screen.queryByText(/Mark as distributed/)).not.toBeInTheDocument();
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

    it("a rejected session (401) signs out with the usual message and returns here after sign-in", async () => {
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

  describe("Distribute (admin)", () => {
    const openDialog = async (user: ReturnType<typeof renderRoutes>["user"]) => {
      await user.click(await screen.findByRole("button", { name: "Distribute" }));
      return screen.findByRole("dialog", { name: /Distribute/ });
    };

    it("offers never-sent and rejected platforms; pending and live are disabled with their status", async () => {
      signInForTest();
      serveTrack(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "live"), delivery(APPLE, "rejected")] }));
      const { user } = renderRoutes(routes, { route });

      const dialog = await openDialog(user);

      const apple = await within(dialog).findByRole("checkbox", { name: /Apple Music/ });
      expect(apple).toBeEnabled();
      expect(apple).not.toBeChecked();
      expect(apple).toHaveAccessibleName(expect.stringContaining("Send again"));
      expect(within(dialog).getByRole("checkbox", { name: /Spotify/ })).toBeDisabled();
      expect(within(dialog).getByRole("checkbox", { name: /Spotify/ })).toHaveAccessibleName(expect.stringContaining("Live"));
      expect(within(dialog).getByRole("checkbox", { name: /YouTube Music/ })).toBeEnabled();
      expect(within(dialog).getByRole("button", { name: "Send" })).toBeDisabled();
    });

    it("sends the chosen platforms, closes, confirms and shows them pending", async () => {
      signInForTest();
      const { calls } = serveTrack(trackDetail({ status: "submitted" }));
      const success = vi.spyOn(toast, "success");
      const { user } = renderRoutes(routes, { route });

      const dialog = await openDialog(user);
      await user.click(await within(dialog).findByRole("checkbox", { name: /Spotify/ }));
      expect(within(dialog).getByRole("button", { name: "Send to 1 platform" })).toBeEnabled();
      await user.click(within(dialog).getByRole("checkbox", { name: /Apple Music/ }));
      await user.click(within(dialog).getByRole("button", { name: "Send to 2 platforms" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(calls.distributes).toEqual([[SPOTIFY, APPLE]]);
      expect(success).toHaveBeenCalledWith("Sent to 2 platforms", expect.anything());
      expect(rows().map((row) => within(row).getAllByRole("cell")[1]!.textContent)).toEqual(["Pending", "Pending"]);
      expect(screen.getByText("Distributed")).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Change status" })).not.toBeInTheDocument();
      expect(screen.getByText("Distributed is final. The status can't change any more.")).toBeInTheDocument();
    });

    it("sends a rejected platform again", async () => {
      signInForTest();
      const { calls } = serveTrack(trackDetail({ status: "distributed", distributions: [delivery(APPLE, "rejected"), delivery(SPOTIFY, "live")] }));
      const { user } = renderRoutes(routes, { route });

      const dialog = await openDialog(user);
      await user.click(await within(dialog).findByRole("checkbox", { name: /Apple Music/ }));
      await user.click(within(dialog).getByRole("button", { name: "Send to 1 platform" }));

      await waitFor(() => expect(within(rowFor("Apple Music")).getByText("Pending")).toBeInTheDocument());
      expect(calls.distributes).toEqual([[APPLE]]);
    });

    it("says so when nothing changed (someone already sent them)", async () => {
      signInForTest();
      const track = serveTrack(trackDetail({ status: "submitted" }));
      const info = vi.spyOn(toast, "info");
      const { user } = renderRoutes(routes, { route });
      const dialog = await openDialog(user);
      await user.click(await within(dialog).findByRole("checkbox", { name: /Spotify/ }));
      // Meanwhile another admin sent Spotify.
      track.set(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "pending")] }));

      await user.click(within(dialog).getByRole("button", { name: "Send to 1 platform" }));

      await waitFor(() => expect(info).toHaveBeenCalledWith("Already sent to these platforms", expect.anything()));
    });

    it("is disabled with the reason when every platform is pending or live", async () => {
      signInForTest();
      serveTrack(
        trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "live"), delivery(APPLE, "pending"), delivery(YOUTUBE, "pending")] }),
      );
      renderRoutes(routes, { route });

      await waitFor(() => expect(screen.getByRole("button", { name: "Distribute" })).toBeDisabled());
      expect(screen.getByRole("button", { name: "Distribute" })).toHaveAccessibleDescription("Sent to every platform");
    });

    it("on a conflict shows the reason, reloads the track and closes", async () => {
      signInForTest();
      const track = serveTrack(trackDetail({ status: "submitted" }));
      server.use(
        http.post("*/api/tracks/:id/distribute", () => {
          track.set(trackDetail({ status: "draft" }));
          return problem(409, { title: "Conflict", detail: "This record was changed by someone else. Reload it and try again." });
        }),
      );
      const error = vi.spyOn(toast, "error");
      const { user } = renderRoutes(routes, { route });
      const dialog = await openDialog(user);
      await user.click(await within(dialog).findByRole("checkbox", { name: /Spotify/ }));
      await user.click(within(dialog).getByRole("button", { name: "Send to 1 platform" }));

      await waitFor(() =>
        expect(error).toHaveBeenCalledWith("Not sent", { description: "This record was changed by someone else. Reload it and try again." }),
      );
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(screen.queryByRole("button", { name: "Distribute" })).not.toBeInTheDocument());
    });

    it("a rejected session (401) signs out and returns here after sign-in", async () => {
      const cleanup = setupAuth(window);
      signInForTest();
      serveTrack(trackDetail({ status: "submitted" }));
      server.use(http.post("*/api/tracks/:id/distribute", () => problem(401, { title: "Unauthorized" })));
      const { user, router } = renderRoutes(routes, { route });
      const dialog = await openDialog(user);
      await user.click(await within(dialog).findByRole("checkbox", { name: /Spotify/ }));
      await user.click(within(dialog).getByRole("button", { name: "Send to 1 platform" }));

      await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
      expect(router.state.location.search).toBe(`?redirect=${encodeURIComponent(route)}`);
      cleanup();
    });

    it("shows an error with Retry when the platforms cannot load", async () => {
      signInForTest();
      serveTrack(trackDetail({ status: "submitted" }));
      let fail = true;
      server.use(http.get("*/api/dsps", () => (fail ? problem(503, { title: "Service unavailable" }) : HttpResponse.json([{ id: SPOTIFY, name: "Spotify" }]))));
      const { user } = renderRoutes(routes, { route });

      const dialog = await openDialog(user);
      expect(await within(dialog).findByRole("alert")).toHaveTextContent("Service unavailable");
      fail = false;
      await user.click(within(dialog).getByRole("button", { name: "Retry" }));
      expect(await within(dialog).findByRole("checkbox", { name: /Spotify/ })).toBeEnabled();
    });

    it("works with the keyboard: Escape closes and focus returns to Distribute", async () => {
      signInForTest();
      serveTrack(trackDetail({ status: "submitted" }));
      const { user } = renderRoutes(routes, { route });
      const button = await screen.findByRole("button", { name: "Distribute" });
      button.focus();
      await user.keyboard("{Enter}");
      const dialog = await screen.findByRole("dialog", { name: /Distribute/ });
      await within(dialog).findByRole("checkbox", { name: /Spotify/ });

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Distribute" })).toHaveFocus();
    });
  });

  describe("platform answers (admin)", () => {
    it("pending rows offer Mark live / Mark rejected; answered rows offer nothing", async () => {
      signInForTest();
      serveTrack(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "pending"), delivery(APPLE, "live")] }));
      renderRoutes(routes, { route });
      await screen.findByRole("table", { name: "Platform deliveries" });

      expect(screen.getByText("Platform answers are simulated.")).toBeInTheDocument();
      expect(within(rowFor("Spotify")).getAllByRole("button").map((b) => b.textContent)).toEqual(["Mark live", "Mark rejected"]);
      expect(within(rowFor("Apple Music")).queryAllByRole("button")).toEqual([]);
    });

    it("records an answer: the row shows it with the answer time and a confirmation names the platform", async () => {
      signInForTest();
      const { calls } = serveTrack(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "pending")] }));
      const success = vi.spyOn(toast, "success");
      const { user } = renderRoutes(routes, { route });
      await screen.findByRole("table", { name: "Platform deliveries" });

      await user.click(within(rowFor("Spotify")).getByRole("button", { name: "Mark live" }));

      await waitFor(() => expect(within(rowFor("Spotify")).getByText("Live")).toBeInTheDocument());
      expect(within(rowFor("Spotify")).queryByText("Waiting")).not.toBeInTheDocument();
      expect(within(rowFor("Spotify")).queryAllByRole("button")).toEqual([]);
      expect(calls.answers).toEqual([{ dspId: SPOTIFY, status: "live" }]);
      expect(success).toHaveBeenCalledWith("Spotify marked live", expect.anything());
    });

    it("a rejected answer makes the platform selectable again in Distribute", async () => {
      signInForTest();
      serveTrack(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "pending")] }));
      const { user } = renderRoutes(routes, { route });
      await screen.findByRole("table", { name: "Platform deliveries" });

      await user.click(within(rowFor("Spotify")).getByRole("button", { name: "Mark rejected" }));
      await waitFor(() => expect(within(rowFor("Spotify")).getByText("Rejected")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: "Distribute" }));
      const dialog = await screen.findByRole("dialog", { name: /Distribute/ });
      expect(await within(dialog).findByRole("checkbox", { name: /Spotify/ })).toHaveAccessibleName(expect.stringContaining("Send again"));
    });

    it("on a conflict shows the reason and reloads", async () => {
      signInForTest();
      const track = serveTrack(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "pending")] }));
      server.use(
        http.patch("*/api/tracks/:id/distributions/:dspId", () => {
          track.set(trackDetail({ status: "distributed", distributions: [delivery(SPOTIFY, "live")] }));
          return problem(409, { title: "Conflict", detail: "The delivery is already live." });
        }),
      );
      const error = vi.spyOn(toast, "error");
      const { user } = renderRoutes(routes, { route });
      await screen.findByRole("table", { name: "Platform deliveries" });

      await user.click(within(rowFor("Spotify")).getByRole("button", { name: "Mark rejected" }));

      await waitFor(() => expect(error).toHaveBeenCalledWith("Answer not recorded", { description: "The delivery is already live." }));
      await waitFor(() => expect(within(rowFor("Spotify")).getByText("Live")).toBeInTheDocument());
    });
  });
});
