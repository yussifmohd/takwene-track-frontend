/**
 * ISRC (ISO 3901): CC-XXX-YY-NNNNN – 2 letters, 3 letters/digits, 2 digits, 5 digits. Same rule as
 * the API (`Isrc.TryNormalize`): any case, outer spaces ignored, all three hyphens or none.
 */
export const ISRC_EXAMPLE = "EG-A1B-26-00001";
export const ISRC_FORMAT = "CC-XXX-YY-NNNNN";

const HYPHENATED = /^([A-Z]{2})-([A-Z0-9]{3})-(\d{2})-(\d{5})$/;
const PLAIN = /^([A-Z]{2})([A-Z0-9]{3})(\d{2})(\d{5})$/;

/** "eg-a1b-26-00001" / "EGA1B2600001" → "EG-A1B-26-00001"; null when the shape is wrong. */
export function normalizeIsrc(input: string): string | null {
  const value = input.trim().toUpperCase();
  const match = HYPHENATED.exec(value) ?? PLAIN.exec(value);
  return match ? `${match[1]}-${match[2]}-${match[3]}-${match[4]}` : null;
}

export const isValidIsrc = (input: string) => normalizeIsrc(input) !== null;
