import { describe, expect, it } from "vitest";
import { loginPathFor, safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it.each([
    ["/account", "/account"],
    ["/account?x=1", "/account?x=1"],
    ["/tracks/42#top", "/tracks/42#top"],
  ])("keeps the in-app path %s", (input, expected) => expect(safeRedirect(input)).toBe(expected));

  it.each([
    ["", "empty"],
    [null, "missing"],
    ["//evil.example", "protocol-relative"],
    ["/\\evil.example", "backslash trick"],
    ["https://evil.example/account", "absolute URL"],
    ["javascript:alert(1)", "javascript scheme"],
    ["account", "relative path"],
    ["/login", "the login page"],
    ["/login?redirect=%2Faccount", "the login page with a query"],
    ["/\tevil", "control character"],
  ])("falls back to / for %s (%s)", (input, _why) => expect(safeRedirect(input)).toBe("/"));

  it("builds the login path with an encoded return address", () => {
    expect(loginPathFor("/account?x=1")).toBe("/login?redirect=%2Faccount%3Fx%3D1");
  });
});
