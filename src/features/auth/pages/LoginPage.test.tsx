import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { routes } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { renderRoutes } from "@/test/render";
import { ADMIN_EMAIL, ADMIN_PASSWORD, currentUser, loginResponse, problem, server } from "@/test/server";
import { signInForTest } from "@/test/session";

function renderLogin(route = "/login") {
  server.use(http.get("*/api/auth/me", () => HttpResponse.json(currentUser())));
  return renderRoutes(routes, { route });
}

async function fillAndSubmit(user: ReturnType<typeof renderLogin>["user"], email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  it("shows field errors without calling the API", async () => {
    let calls = 0;
    server.use(http.post("*/api/auth/login", () => (calls++, HttpResponse.json(loginResponse()))));
    const { user } = renderLogin();

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(calls).toBe(0);
  });

  it("rejects a malformed email", async () => {
    const { user } = renderLogin();
    await fillAndSubmit(user, "not-an-email");
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("signs in, stores the session and goes to the safe return address", async () => {
    let body: unknown;
    server.use(
      http.post("*/api/auth/login", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(loginResponse());
      }),
    );
    const { user, router } = renderLogin("/login?redirect=%2Faccount");

    await fillAndSubmit(user, `  ${ADMIN_EMAIL} `);

    await waitFor(() => expect(router.state.location.pathname).toBe("/account"));
    expect(body).toEqual({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(useAuthStore.getState().session).toMatchObject({ accessToken: "jwt-from-server", email: ADMIN_EMAIL, roles: ["Admin"] });
    expect(await screen.findByRole("heading", { name: "Your account" })).toBeInTheDocument();
  });

  it("ignores an unsafe return address", async () => {
    server.use(http.post("*/api/auth/login", () => HttpResponse.json(loginResponse())));
    const { user, router } = renderLogin("/login?redirect=https%3A%2F%2Fevil.example");

    await fillAndSubmit(user);

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("on 401 shows the generic message, keeps the email, clears and focuses the password", async () => {
    server.use(http.post("*/api/auth/login", () => problem(401, { title: "Unauthorized", detail: "Invalid email or password." })));
    const { user } = renderLogin();

    await fillAndSubmit(user, ADMIN_EMAIL, "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(screen.getByLabelText("Email")).toHaveValue(ADMIN_EMAIL);
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveFocus();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("maps 400 validation problems onto the fields", async () => {
    server.use(http.post("*/api/auth/login", () => problem(400, { errors: { email: ["Email is not a valid email address."] } })));
    const { user } = renderLogin();

    await fillAndSubmit(user, "admin@takwene.loc");

    expect(await screen.findByText("Email is not a valid email address.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("on 429 tells the user how long to wait", async () => {
    server.use(http.post("*/api/auth/login", () => problem(429, { title: "Too many requests" }, { "Retry-After": "37" })));
    const { user } = renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many sign-in attempts. Try again in 37 seconds.");
  });

  it("explains when the server cannot be reached", async () => {
    server.use(http.post("*/api/auth/login", () => HttpResponse.error()));
    const { user } = renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
  });

  it("disables the button while signing in", async () => {
    let release!: () => void;
    server.use(
      http.post("*/api/auth/login", async () => {
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json(loginResponse());
      }),
    );
    const { user } = renderLogin();

    await fillAndSubmit(user);

    expect(await screen.findByRole("button", { name: "Signing in" })).toBeDisabled();
    release();
  });

  it("sends a signed-in visitor to the status page", async () => {
    signInForTest();
    const { router } = renderLogin();
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("works with the keyboard only: tab to the fields, type, Enter submits", async () => {
    server.use(http.post("*/api/auth/login", () => HttpResponse.json(loginResponse())));
    const { user, router } = renderLogin("/login?redirect=%2Faccount");
    screen.getByLabelText("Email").focus();

    await user.keyboard(ADMIN_EMAIL);
    await user.tab();
    expect(screen.getByLabelText("Password")).toHaveFocus();
    await user.keyboard(`${ADMIN_PASSWORD}{Enter}`);

    await waitFor(() => expect(router.state.location.pathname).toBe("/account"));
  });
});
