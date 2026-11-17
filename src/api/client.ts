import { ApiError, parseProblem, parseRetryAfter } from "./problem";

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

type TokenProvider = () => string | null | undefined;
type UnauthorizedHandler = () => void;

let getAccessToken: TokenProvider = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

/** Wired to the auth store in `src/lib/authSetup.ts`. */
export function configureApiClient(options: { getAccessToken?: TokenProvider; onUnauthorized?: UnauthorizedHandler }) {
  if (options.getAccessToken) getAccessToken = options.getAccessToken;
  if (options.onUnauthorized) onUnauthorized = options.onUnauthorized;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Non-2xx statuses whose body is data, not an error (e.g. 503 from /health). */
  acceptStatuses?: number[];
  /** A 401 here is an answer (e.g. wrong password), not an invalid session: don't sign out. */
  skipAuthHandling?: boolean;
}

/** The only way the app talks to the API: same-origin `/api`, JSON in/out, ProblemDetails → ApiError. */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, acceptStatuses = [], skipAuthHandling = false } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, { title: "Network error", detail: "The server could not be reached." });
  }

  if (!response.ok && !acceptStatuses.includes(response.status)) {
    if (response.status === 401 && !skipAuthHandling) onUnauthorized();
    throw new ApiError(response.status, await parseProblem(response), {
      retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
    });
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return (await response.json()) as T;
}
