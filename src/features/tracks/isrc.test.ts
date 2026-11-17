import { describe, expect, it } from "vitest";
import { isValidIsrc, normalizeIsrc } from "./isrc";

describe("ISRC", () => {
  it.each([
    ["EG-A1B-26-00001", "EG-A1B-26-00001"],
    ["eg-a1b-26-00001", "EG-A1B-26-00001"],
    ["EGA1B2600001", "EG-A1B-26-00001"],
    ["  ega1b2600001 ", "EG-A1B-26-00001"],
    ["AE-123-99-99999", "AE-123-99-99999"],
  ])("accepts %j as %s", (input, expected) => {
    expect(normalizeIsrc(input)).toBe(expected);
  });

  it.each([
    "",
    "EG-A1B-2600001", // some hyphens only
    "EGA1B-26-00001",
    "E1-A1B-26-00001", // country must be letters
    "EG-A1B-2X-00001", // year must be digits
    "EG-A1B-26-0001", // too short
    "EG-A1B-26-000001", // too long
    "EG A1B 26 00001",
    "EG-A_B-26-00001",
    "ΕG-A1B-26-00001", // Greek capital epsilon
  ])("refuses %j", (input) => {
    expect(isValidIsrc(input)).toBe(false);
  });
});
