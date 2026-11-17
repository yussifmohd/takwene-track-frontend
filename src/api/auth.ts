import { apiFetch } from "./client";
import type { components } from "./schema";

export type LoginRequest = components["schemas"]["LoginRequest"];
export type LoginResponse = components["schemas"]["LoginResponse"];
export type CurrentUser = components["schemas"]["CurrentUserDto"];

/** A 401 means wrong credentials here, so it must not trigger the "session invalid" sign-out. */
export function login(body: LoginRequest) {
  return apiFetch<LoginResponse>("/auth/login", { method: "POST", body, skipAuthHandling: true });
}

export function getCurrentUser(signal?: AbortSignal) {
  return apiFetch<CurrentUser>("/auth/me", { signal });
}
