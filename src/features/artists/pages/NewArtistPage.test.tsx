import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import type { Artist } from "@/api/artists";
import { setupAuth } from "@/lib/authSetup";
import { routes } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { artistsHandler, problem, sampleArtists, server } from "@/test/server";
import { signInForTest } from "@/test/session";

type Body = { name: string; countryCode: string; email: string };

function openForm() {
  signInForTest();
  return renderRoutes(routes, { route: "/artists/new" });
}

async function fill(user: ReturnType<typeof openForm>["user"], values: Partial<Body>) {
  if (values.name !== undefined) await user.type(screen.getByLabelText("Name"), values.name);
  if (values.countryCode !== undefined) await user.selectOptions(screen.getByLabelText("Country"), values.countryCode);
  if (values.email !== undefined) await user.type(screen.getByLabelText("Email"), values.email);
}

const submit = () => screen.getByRole("button", { name: "Add artist" });

describe("NewArtistPage", () => {
  it("checks every field before sending and focuses the first problem", async () => {
    let posted = 0;
    server.use(http.post("*/api/artists", () => { posted++; return HttpResponse.json({}); }));
    const { user } = openForm();

    await user.click(submit());

    expect(await screen.findByText("Enter the artist's name.")).toBeInTheDocument();
    expect(screen.getByText("Choose a country.")).toBeInTheDocument();
    expect(screen.getByText("Enter the artist's email.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(posted).toBe(0);
  });

  it("types names right-to-left when they are Arabic, and lists countries by name", async () => {
    const { user } = openForm();
    expect(screen.getByLabelText("Name")).toHaveAttribute("dir", "auto");
    expect(screen.getByLabelText("Email")).toHaveAttribute("dir", "ltr");
    const country = screen.getByLabelText("Country");
    expect(within(country).getByRole("option", { name: "Egypt" })).toHaveValue("EG");
    expect(within(country).getAllByRole("option")).toHaveLength(250); // placeholder + 249
    await user.selectOptions(country, "Egypt");
    expect(country).toHaveValue("EG");
  });

  it("sends trimmed values, shows progress, returns to the list with a confirmation and the new artist", async () => {
    const all: Artist[] = [...sampleArtists];
    let received: Body | undefined;
    server.use(
      http.post("*/api/artists", async ({ request }) => {
        received = (await request.json()) as Body;
        await delay(50);
        const created: Artist = { id: "new", ...received, createdAtUtc: "2026-11-17T12:00:00Z" };
        all.push(created);
        return HttpResponse.json(created, { status: 201, headers: { Location: "/api/artists/new" } });
      }),
      artistsHandler(all),
    );
    const success = vi.spyOn(toast, "success");
    const { user, router } = openForm();

    await fill(user, { name: "  فيروز ✨ ", countryCode: "LB", email: " fairuz@example.com " });
    await user.click(submit());

    expect(await screen.findByRole("button", { name: "Adding artist" })).toBeDisabled();
    await waitFor(() => expect(router.state.location.pathname).toBe("/artists"));
    expect(received).toEqual({ name: "فيروز ✨", countryCode: "LB", email: "fairuz@example.com" });
    expect(success).toHaveBeenCalledWith("Artist added", expect.objectContaining({ description: expect.anything() }));
    expect(await within(await screen.findByRole("table", { name: "Artists" })).findByText("فيروز ✨")).toBeInTheDocument();
  });

  it("places server field errors (400) next to their fields", async () => {
    server.use(
      http.post("*/api/artists", () =>
        problem(400, { title: "One or more validation errors occurred.", errors: { name: ["Name must be at most 200 characters."], countryCode: ["Country must be an ISO 3166-1 alpha-2 code, for example EG or SA."] } }),
      ),
    );
    const { user } = openForm();
    await fill(user, { name: "Valid", countryCode: "EG", email: "v@example.com" });
    await user.click(submit());

    expect(await screen.findByText("Name must be at most 200 characters.")).toBeInTheDocument();
    expect(screen.getByText("Country must be an ISO 3166-1 alpha-2 code, for example EG or SA.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("shows a duplicate email (409) under Email and keeps the other values", async () => {
    server.use(http.post("*/api/artists", () => problem(409, { title: "Conflict", errors: { email: ["An artist with this email already exists."] } })));
    const { user } = openForm();
    await fill(user, { name: "عمرو دياب", countryCode: "EG", email: "booking@example.com" });
    await user.click(submit());

    const message = await screen.findByText("An artist with this email already exists.");
    expect(message).toHaveAttribute("id", "email-error");
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(/An artist with this email already exists\./);
    expect(screen.getByLabelText("Name")).toHaveValue("عمرو دياب");
    expect(screen.getByLabelText("Country")).toHaveValue("EG");
  });

  it.each([
    ["a server error", () => problem(500, { title: "Server error", detail: "Something failed on our side." }), "Server error. Something failed on our side."],
    ["no connection", () => HttpResponse.error(), "Can't reach the server. Check your connection or that the API is running, then try again."],
  ])("shows %s as a message on the form", async (_, response, text) => {
    server.use(http.post("*/api/artists", response));
    const { user } = openForm();
    await fill(user, { name: "Valid", countryCode: "EG", email: "v@example.com" });
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(text);
    expect(submit()).toBeEnabled();
  });

  it("a rejected session (401) signs out with the Phase 1 message and returns here after sign-in", async () => {
    const cleanup = setupAuth(window);
    server.use(http.post("*/api/artists", () => problem(401, { title: "Unauthorized" })));
    const { user, router } = openForm();
    await fill(user, { name: "Valid", countryCode: "EG", email: "v@example.com" });
    await user.click(submit());

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(router.state.location.search).toBe("?redirect=%2Fartists%2Fnew");
    expect(useAuthStore.getState().session).toBeNull();
    expect(await screen.findByRole("status")).toHaveTextContent("Your session is no longer valid.");
    cleanup();
  });
});
