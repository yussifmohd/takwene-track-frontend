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
