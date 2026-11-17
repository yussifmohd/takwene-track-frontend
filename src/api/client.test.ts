import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { apiFetch, configureApiClient } from "./client";
import { ApiError, describeError, getFieldErrors } from "./problem";

describe("apiFetch", () => {
  afterEach(() => configureApiClient({ getAccessToken: () => null, onUnauthorized: () => {} }));

  it("returns parsed JSON for 2xx", async () => {
    server.use(http.get("*/api/things", () => HttpResponse.json({ id: 1 })));
    await expect(apiFetch<{ id: number }>("/things")).resolves.toEqual({ id: 1 });
  });

  it("parses problem+json into ApiError", async () => {
    server.use(
      http.get("*/api/things/42", () =>
        HttpResponse.json(
          { title: "Resource not found", status: 404, detail: "Track 42 not found.", traceId: "abc" },
          { status: 404, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );

    const error = await apiFetch("/things/42").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).problem.detail).toBe("Track 42 not found.");
    expect((error as ApiError).problem.traceId).toBe("abc");
  });

  it("synthesises a problem when the error body is not JSON", async () => {
    server.use(http.get("*/api/broken", () => new HttpResponse("<html>Bad gateway</html>", { status: 502, statusText: "Bad Gateway" })));

    const error = (await apiFetch("/broken").catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(502);
    expect(error.problem.title).toBe("Bad Gateway");
  });

  it("returns the body of an accepted non-2xx status", async () => {
    server.use(http.get("*/api/health", () => HttpResponse.json({ status: "unhealthy" }, { status: 503 })));
    await expect(apiFetch("/health", { acceptStatuses: [503] })).resolves.toEqual({ status: "unhealthy" });
  });

  it("adds the bearer token from the provider", async () => {
    let authorization: string | null = null;
    server.use(
      http.get("*/api/secure", ({ request }) => {
        authorization = request.headers.get("authorization");
        return HttpResponse.json({});
      }),
    );
    configureApiClient({ getAccessToken: () => "token-123" });

    await apiFetch("/secure");

    expect(authorization).toBe("Bearer token-123");
  });

  it("calls onUnauthorized on 401", async () => {
    const onUnauthorized = vi.fn();
    configureApiClient({ onUnauthorized });
    server.use(http.get("*/api/secure", () => HttpResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 })));

    await expect(apiFetch("/secure")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("maps a network failure to ApiError with status 0", async () => {
    server.use(http.get("*/api/down", () => HttpResponse.error()));

    const error = (await apiFetch("/down").catch((e: unknown) => e)) as ApiError;

    expect(error.status).toBe(0);
    expect(error.isNetworkError).toBe(true);
    expect(describeError(error).title).toBe("Can't reach the server");
  });

  it("exposes validation errors per field", () => {
    const error = new ApiError(400, { errors: { email: ["Email is invalid.", "Too long."], "items[0].unitPrice": ["Must be positive."] } });
    expect(getFieldErrors(error)).toEqual({ email: "Email is invalid.", "items[0].unitPrice": "Must be positive." });
  });
});
