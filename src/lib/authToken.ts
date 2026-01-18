/**
 * Centralized auth token helpers.
 *
 * Goals:
 * - Avoid sprinkling localStorage key fallbacks across the codebase.
 * - Provide an event-driven signal when the token changes, so realtime/socket code does not poll.
 */

export const AUTH_TOKEN_KEYS = ["token", "accessToken", "access_token"] as const;

export type AuthTokenKey = (typeof AUTH_TOKEN_KEYS)[number];

export function getAuthToken(): string {
  for (const k of AUTH_TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return "";
}

export function setAuthToken(token: string, key: AuthTokenKey = "token") {
  // Normalize: store only one canonical key, but also clear legacy ones to avoid stale reads.
  for (const k of AUTH_TOKEN_KEYS) localStorage.removeItem(k);
  localStorage.setItem(key, token);
  notifyAuthTokenChanged();
}

export function clearAuthToken() {
  for (const k of AUTH_TOKEN_KEYS) localStorage.removeItem(k);
  notifyAuthTokenChanged();
}

/**
 * Notify listeners within the same tab.
 * Note: localStorage "storage" event only fires in OTHER tabs.
 */
export function notifyAuthTokenChanged() {
  window.dispatchEvent(new Event("auth:token"));
}
