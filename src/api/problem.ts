/** RFC 7807 ProblemDetails as returned by the API for every error (backend constitution II). */
export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  traceId?: string | null;
  /** Present on 400 validation problems: camelCase field path → messages. */
  errors?: Record<string, string[]>;
}

/** Thrown by apiFetch for every non-accepted response and for network failures (status 0). */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;
  /** From `Retry-After` on 429/503, in whole seconds. */
  readonly retryAfterSeconds?: number;

  constructor(status: number, problem: ProblemDetails, options: { retryAfterSeconds?: number } = {}) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Reads a ProblemDetails body, or synthesises one when the body is not problem JSON. */
export async function parseProblem(response: Response): Promise<ProblemDetails> {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    try {
      const body = (await response.json()) as ProblemDetails;
      return { status: response.status, ...body };
    } catch {
      // fall through to the synthesised problem
    }
  }
  return { status: response.status, title: response.statusText || "Request failed" };
}

/** `Retry-After` as seconds: delta-seconds or an HTTP date; undefined when absent or invalid. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const date = Date.parse(trimmed);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - now) / 1000));
}

/** Field errors for forms: `{ email: "Email is invalid." }` (first message per field). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || !error.problem.errors) return {};
  return Object.fromEntries(
    Object.entries(error.problem.errors)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field, messages[0]!]),
  );
}

/** One human sentence for toasts and error states. */
export function describeError(error: unknown): { title: string; detail?: string } {
  if (isApiError(error)) {
    if (error.isNetworkError) {
      return { title: "Can't reach the server", detail: "Check your connection or that the API is running, then try again." };
    }
    return { title: error.problem.title ?? "Request failed", detail: error.problem.detail ?? undefined };
  }
  return { title: "Something went wrong", detail: error instanceof Error ? error.message : undefined };
}
