import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, COUNTRY_LIST_HASH, COUNTRY_OPTIONS, countryName, isCountryCode } from "./countries";

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("countries", () => {
  it("has the API's 249 codes, sorted, with the shared hash", async () => {
    expect(COUNTRY_CODES).toHaveLength(249);
    expect([...COUNTRY_CODES]).toEqual([...COUNTRY_CODES].sort());
    expect(await sha256Hex(COUNTRY_CODES.join(","))).toBe(COUNTRY_LIST_HASH);
  });

  it("names countries in English and shows unknown codes as they are", () => {
    expect(countryName("EG")).toBe("Egypt");
    expect(countryName("SA")).toBe("Saudi Arabia");
    expect(countryName("AE")).toBe("United Arab Emirates");
    expect(countryName("PS")).toBe("Palestine");
    expect(countryName("XX")).toBe("XX");
    expect(isCountryCode("UK")).toBe(false);
  });

  it("offers every country once, sorted by name", () => {
    expect(COUNTRY_OPTIONS).toHaveLength(249);
    const names = COUNTRY_OPTIONS.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    expect(new Set(COUNTRY_OPTIONS.map((o) => o.code)).size).toBe(249);
    expect(COUNTRY_OPTIONS.every((o) => o.name !== o.code)).toBe(true);
  });
});
