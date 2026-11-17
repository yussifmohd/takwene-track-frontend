const ORIGIN = "http://same-origin.invalid";

/**
 * The in-app path to return to after sign-in. Only same-origin paths are allowed (no open
 * redirect); anything else, the login page itself, or nothing → "/".
 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return "/";
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return "/";
  }
  if (url.origin !== ORIGIN) return "/";
  if (url.pathname === "/login" || url.pathname.startsWith("/login/")) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

/** "/login?redirect=%2Faccount%3Fx%3D1" for the current location. */
export function loginPathFor(pathWithSearch: string) {
  return `/login?redirect=${encodeURIComponent(pathWithSearch)}`;
}
