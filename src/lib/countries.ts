/**
 * The 249 officially assigned ISO 3166-1 alpha-2 codes – the same list the API validates against
 * (backend `CountryCodes`). Both repos assert the SHA-256 of the comma-joined list, so the copies
 * cannot drift silently. Names come from the browser (`Intl.DisplayNames`), no extra package.
 */
export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

/** SHA-256 (hex) of `COUNTRY_CODES.join(",")`; identical to the backend's `CountryCodes.ListHash`. */
export const COUNTRY_LIST_HASH = "1e05631f6e613a0c8a7174d385daf8e92426f673fcb49fb791ef06e61c83e16f";

const assigned = new Set<string>(COUNTRY_CODES);
const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "code" });

/**
 * Names we set ourselves instead of the browser's: engines disagree on PS ("Palestinian
 * Territories" in Node, "Palestinian Authority" in Edge); ISO 3166-1 names it "Palestine, State of".
 */
const NAME_OVERRIDES: Partial<Record<CountryCode, string>> = { PS: "Palestine" };

export function isCountryCode(value: string): value is CountryCode {
  return assigned.has(value);
}

/** "EG" → "Egypt". Unknown codes are shown as they are. */
export function countryName(code: string): string {
  if (!isCountryCode(code)) return code;
  return NAME_OVERRIDES[code] ?? regionNames.of(code) ?? code;
}

/** Every country as `{ code, name }`, sorted by name (for the picker). */
export const COUNTRY_OPTIONS: ReadonlyArray<{ code: CountryCode; name: string }> = COUNTRY_CODES.map((code) => ({
  code,
  name: countryName(code),
})).sort((a, b) => a.name.localeCompare(b.name, "en"));
