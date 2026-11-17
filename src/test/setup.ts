import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";
import { resetAuth } from "./session";

// Relative "/api" URLs need an origin under jsdom/undici.
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) =>
  realFetch(typeof input === "string" && input.startsWith("/") ? new URL(input, "http://localhost").toString() : input, init);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetAuth();
});
afterAll(() => server.close());
