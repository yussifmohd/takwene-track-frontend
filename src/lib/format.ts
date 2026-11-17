const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** "14:05:09" in the viewer's time zone. */
export function formatTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

/** "12 ms" / "1.2 s" */
export function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** "17 Nov, 11:08" in the viewer's time zone. */
export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormat.format(date);
}

/** "in 52 minutes" / "in less than a minute" / "ended". */
export function formatTimeUntil(value: string | Date, now = Date.now()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.floor((date.getTime() - now) / 60_000);
  if (Number.isNaN(minutes) || date.getTime() <= now) return "ended";
  if (minutes < 1) return "in less than a minute";
  return minutes === 1 ? "in 1 minute" : `in ${minutes} minutes`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "17 Nov 2026" in the viewer's time zone. */
export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

const calendarDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * "2026-12-01" → "1 Dec 2026". Release dates are calendar dates without a time zone, so they are
 * formatted in UTC: `new Date("2026-12-01")` shown in local time would be 30 Nov west of Greenwich.
 */
export function formatCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? value : calendarDateFormat.format(date);
}
