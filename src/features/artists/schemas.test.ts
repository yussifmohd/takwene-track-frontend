import { describe, expect, it } from "vitest";
import { createArtistSchema } from "./schemas";

const valid = { name: "Amr Diab", countryCode: "EG", email: "booking@example.com" };
const errorsOf = (input: Partial<typeof valid>) => {
  const result = createArtistSchema.safeParse({ ...valid, ...input });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("createArtistSchema", () => {
  it("accepts a valid artist and trims name and email", () => {
    expect(createArtistSchema.parse({ name: "  عمرو دياب ", countryCode: "EG", email: " Booking@Example.com " })).toEqual({
      name: "عمرو دياب",
      countryCode: "EG",
      email: "Booking@Example.com",
    });
  });

  it("requires every field", () => {
    expect(errorsOf({ name: "   ", countryCode: "", email: "" })).toEqual({
      name: "Enter the artist's name.",
      countryCode: "Choose a country.",
      email: "Enter the artist's email.",
    });
  });

  it("counts characters, not UTF-16 units, like the API", () => {
    expect(errorsOf({ name: "🎤".repeat(200) })).toEqual({});
    expect(errorsOf({ name: "ع".repeat(200) })).toEqual({});
    expect(errorsOf({ name: "ع".repeat(201) })).toEqual({ name: "Use at most 200 characters." });
  });

  it("checks the email format and length", () => {
    expect(errorsOf({ email: "not-an-email" })).toEqual({ email: "Enter a valid email address." });
    expect(errorsOf({ email: `${"a".repeat(250)}@x.eg` })).toHaveProperty("email", "Use at most 254 characters.");
  });

  it("only accepts assigned country codes", () => {
    expect(errorsOf({ countryCode: "UK" })).toEqual({ countryCode: "Choose a country." });
    expect(errorsOf({ countryCode: "SA" })).toEqual({});
  });
});
