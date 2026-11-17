import { describe, expect, it } from "vitest";
import { createTrackSchema, isCalendarDate } from "./schemas";

const valid = { title: " Tamally Maak ", artistId: "a1", isrc: "eg-a1b-26-00001", genre: "R&B", releaseDate: "2026-12-01" };
const messages = (input: Partial<typeof valid>) => {
  const result = createTrackSchema.safeParse({ ...valid, ...input });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("createTrackSchema", () => {
  it("trims title and ISRC and keeps the rest", () => {
    expect(createTrackSchema.parse(valid)).toEqual({ ...valid, title: "Tamally Maak", isrc: "eg-a1b-26-00001" });
  });

  it("says what is missing", () => {
    expect(messages({ title: "  ", artistId: "", isrc: "", genre: "", releaseDate: "" })).toEqual({
      title: "Enter the track title.",
      artistId: "Choose an artist.",
      isrc: "Enter the ISRC.",
      genre: "Choose a genre.",
      releaseDate: "Enter the release date.",
    });
  });

  it("explains the ISRC format and the date range", () => {
    expect(messages({ isrc: "EG-A1B-2600001" }).isrc).toBe("Enter the ISRC as CC-XXX-YY-NNNNN, e.g. EG-A1B-26-00001.");
    expect(messages({ releaseDate: "1899-12-31" }).releaseDate).toBe("Enter a release date between 1900 and 2100.");
    expect(messages({ releaseDate: "2101-01-01" }).releaseDate).toBe("Enter a release date between 1900 and 2100.");
    expect(messages({ releaseDate: "2100-12-31" })).toEqual({});
  });

  it("counts the title in characters, not UTF-16 units", () => {
    expect(messages({ title: "🎵".repeat(200) })).toEqual({});
    expect(messages({ title: "🎵".repeat(201) }).title).toBe("Use at most 200 characters.");
  });

  it("refuses genres that are not on the list (exact spelling)", () => {
    expect(messages({ genre: "r&b" }).genre).toBe("Choose a genre.");
  });
});

describe("isCalendarDate", () => {
  it.each(["2026-02-28", "2024-02-29", "1900-01-01"])("accepts %s", (value) => expect(isCalendarDate(value)).toBe(true));
  it.each(["2026-02-29", "2026-13-01", "2026-1-1", "01/12/2026", ""])("refuses %j", (value) =>
    expect(isCalendarDate(value)).toBe(false),
  );
});
