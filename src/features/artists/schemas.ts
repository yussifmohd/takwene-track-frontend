import { z } from "zod";
import { isCountryCode } from "@/lib/countries";

/** Same limits as the API (`Artist.NameMaxLength` / `EmailMaxLength`); lengths count code points. */
export const NAME_MAX = 200;
export const EMAIL_MAX = 254;

const emailFormat = z.email();
const codePoints = (value: string) => [...value].length;

export const createArtistSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, { error: "Enter the artist's name.", abort: true })
        .refine((value) => codePoints(value) <= NAME_MAX, `Use at most ${NAME_MAX} characters.`),
    ),
  countryCode: z.string().refine(isCountryCode, "Choose a country."),
  email: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, { error: "Enter the artist's email.", abort: true })
        .refine((value) => codePoints(value) <= EMAIL_MAX, `Use at most ${EMAIL_MAX} characters.`)
        .refine((value) => emailFormat.safeParse(value).success, "Enter a valid email address."),
    ),
});

export type CreateArtistInput = z.input<typeof createArtistSchema>;
export type CreateArtistValues = z.output<typeof createArtistSchema>;
