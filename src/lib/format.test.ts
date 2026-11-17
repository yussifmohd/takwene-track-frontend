import { describe, expect, it } from "vitest";
import { formatCalendarDate } from "./format";

describe("formatCalendarDate", () => {
  it("shows the calendar date itself, whatever the viewer's time zone", () => {
    // UTC formatting: a local-time Date would show 30 Nov west of Greenwich.
    expect(formatCalendarDate("2026-12-01")).toBe("1 Dec 2026");
    expect(formatCalendarDate("1900-01-01")).toBe("1 Jan 1900");
  });

  it("returns anything that is not YYYY-MM-DD unchanged", () => {
    expect(formatCalendarDate("soon")).toBe("soon");
  });
});
