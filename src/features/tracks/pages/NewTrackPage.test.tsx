import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import type { CreateTrackRequest } from "@/api/tracks";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { artistsHandler, problem, sampleArtists, server, trackDetail } from "@/test/server";
import { signInForTest } from "@/test/session";

function openForm() {
  signInForTest();
  server.use(artistsHandler());
  return renderRoutes(routes, { route: "/tracks/new" });
}

type User = ReturnType<typeof openForm>["user"];

async function pickArtist(user: User, typed: string, name: string) {
  await user.type(screen.getByRole("combobox", { name: "Artist" }), typed);
  await user.click(await screen.findByRole("option", { name: new RegExp(name) }));
}

async function fillValid(user: User) {
  await user.type(screen.getByLabelText("Title"), "  Tamally Maak ");
  await pickArtist(user, "amr", "Amr Diab");
  await user.type(screen.getByLabelText("ISRC"), "eg-a1b-26-00001");
  await user.selectOptions(screen.getByLabelText("Genre"), "Arabic Pop");
  await user.type(screen.getByLabelText("Release date"), "2026-12-01");
}

const submit = () => screen.getByRole("button", { name: "Add track" });

describe("NewTrackPage", () => {
  it("checks every field before sending and focuses the first problem", async () => {
    let posted = 0;
    server.use(http.post("*/api/tracks", () => void posted++));
    const { user } = openForm();

    await user.click(submit());

    expect(await screen.findByText("Enter the track title.")).toBeInTheDocument();
    expect(screen.getByText("Choose an artist.")).toBeInTheDocument();
    expect(screen.getByText("Enter the ISRC.")).toBeInTheDocument();
    expect(screen.getByText("Choose a genre.")).toBeInTheDocument();
    expect(screen.getByText("Enter the release date.")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveFocus();
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("ISRC"), "EG-A1B-2600001");
    await user.click(submit());
    expect(await screen.findByText("Enter the ISRC as CC-XXX-YY-NNNNN, e.g. EG-A1B-26-00001.")).toBeInTheDocument();
    expect(posted).toBe(0);
  });

  it("sends the values, shows progress, and opens the new track with a confirmation", async () => {
    let received: CreateTrackRequest | undefined;
    server.use(
      http.post("*/api/tracks", async ({ request }) => {
        received = (await request.json()) as CreateTrackRequest;
        await delay(50);
        return HttpResponse.json(trackDetail({ id: "new-track", status: "draft", title: received.title }), { status: 201 });
      }),
    );
    const success = vi.spyOn(toast, "success");
    const { user, router } = openForm();

    await fillValid(user);
    await user.click(submit());

    expect(await screen.findByRole("button", { name: "Adding track" })).toBeDisabled();
    await waitFor(() => expect(router.state.location.pathname).toBe("/tracks/new-track"));
    expect(received).toEqual({
      title: "Tamally Maak",
      artistId: sampleArtists[0]!.id,
      isrc: "eg-a1b-26-00001",
      genre: "Arabic Pop",
      releaseDate: "2026-12-01",
    });
    expect(success).toHaveBeenCalledWith("Track added", expect.objectContaining({ description: expect.anything() }));
    // The detail comes from the create response: no extra request, no placeholder.
    expect(await screen.findByRole("heading", { level: 1, name: "Tamally Maak" })).toBeInTheDocument();
  });

  it("shows a duplicate ISRC under ISRC and keeps the other values", async () => {
    server.use(
      http.post("*/api/tracks", () =>
        problem(409, { title: "Conflict", errors: { isrc: ["Another track already uses this ISRC."] } }),
      ),
    );
    const { user } = openForm();
    await fillValid(user);
    await user.click(submit());

    const message = await screen.findByText("Another track already uses this ISRC.");
    expect(screen.getByLabelText("ISRC")).toHaveAttribute("aria-describedby", expect.stringContaining(message.id));
    await waitFor(() => expect(screen.getByLabelText("ISRC")).toHaveFocus());
    expect(screen.getByLabelText("Title")).toHaveValue("  Tamally Maak ");
    expect(screen.getByRole("combobox", { name: "Artist" })).toHaveValue("Amr Diab");
  });

  it("shows server field errors for the artist and other fields", async () => {
    server.use(
      http.post("*/api/tracks", () =>
        problem(400, { title: "Validation failed", errors: { artistId: ["Choose an existing artist."], releaseDate: ["Release date must be between 1900-01-01 and 2100-12-31."] } }),
      ),
    );
    const { user } = openForm();
    await fillValid(user);
    await user.click(submit());

    expect(await screen.findByText("Choose an existing artist.")).toBeInTheDocument();
    expect(screen.getByText("Release date must be between 1900-01-01 and 2100-12-31.")).toBeInTheDocument();
  });

  it("shows other errors as a message on the form", async () => {
    server.use(http.post("*/api/tracks", () => problem(500, { title: "Server error", detail: "Try again later." })));
    const { user } = openForm();
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("Server error. Try again later.");
    expect(submit()).toBeEnabled();
  });

  it("a rejected session (401) signs out with the Phase 1 message and returns here after sign-in", async () => {
    const cleanup = setupAuth(window);
    server.use(http.post("*/api/tracks", () => problem(401, { title: "Unauthorized" })));
    const { user, router } = openForm();
    await fillValid(user);
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Ftracks%2Fnew");
    expect(useAuthStore.getState().session).toBeNull();
    cleanup();
  });

  it("sends a signed-out visitor to sign-in first", async () => {
    const { router } = renderRoutes(routes, { route: "/tracks/new" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Ftracks%2Fnew");
  });

  it("tells a signed-in user without the Admin role that they can't add tracks", async () => {
    signInForTest({ roles: [] });
    renderRoutes(routes, { route: "/tracks/new" });
    expect(await screen.findByRole("heading", { name: "Only admins can add tracks" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to tracks" })).toHaveAttribute("href", "/");
  });
});
