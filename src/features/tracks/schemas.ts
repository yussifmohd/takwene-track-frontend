import { z } from "zod";
import { GENRES, isGenre, type Genre } from "./catalog";
import { ISRC_EXAMPLE, ISRC_FORMAT, isValidIsrc } from "./isrc";

/** Same limits as the API (`Track.TitleMaxLength`, 1900–2100); lengths count code points. */
export const TITLE_MAX = 200;
export const MIN_RELEASE_DATE = "1900-01-01";
export const MAX_RELEASE_DATE = "2100-12-31";

const codePoints = (value: string) => [...value].length;
const trimmed = (rule: z.ZodType<string, string>) => z.string().transform((value) => value.trim()).pipe(rule);

/** A real calendar date written YYYY-MM-DD ("2026-02-30" is not). */
export function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export const createTrackSchema = z.object({
  title: trimmed(
    z
      .string()
      .min(1, { error: "Enter the track title.", abort: true })
      .refine((value) => codePoints(value) <= TITLE_MAX, `Use at most ${TITLE_MAX} characters.`),
  ),
  artistId: z.string().min(1, "Choose an artist."),
  isrc: trimmed(
    z
      .string()
      .min(1, { error: "Enter the ISRC.", abort: true })
      .refine(isValidIsrc, `Enter the ISRC as ${ISRC_FORMAT}, e.g. ${ISRC_EXAMPLE}.`),
  ),
  genre: z
    .string()
    .refine(isGenre, "Choose a genre.")
    .transform((value) => value as Genre),
  releaseDate: z
    .string()
    .min(1, { error: "Enter the release date.", abort: true })
    .refine(isCalendarDate, { error: "Enter a real date.", abort: true })
    .refine((value) => value >= MIN_RELEASE_DATE && value <= MAX_RELEASE_DATE, "Enter a release date between 1900 and 2100."),
});

export type CreateTrackInput = z.input<typeof createTrackSchema>;
export type CreateTrackValues = z.output<typeof createTrackSchema>;
export { GENRES };
