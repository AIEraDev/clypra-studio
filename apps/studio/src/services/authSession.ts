import { getStudioApiBaseUrl } from "./apiConfig";

export const AUTH_TOKEN_KEY = "clypra_auth_token";

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface RefreshSuccess {
  ok: true;
  token: string;
  user?: SessionUser;
}

export interface RefreshFailure {
  ok: false;
  // A 401/403 from the refresh endpoint means the session is definitely invalid.
  // Network errors and 5xx responses are retryable and must not log the user out.
  definitive: boolean;
}

export type RefreshOutcome = RefreshSuccess | RefreshFailure;

let refreshInFlight: Promise<RefreshOutcome> | null = null;

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): number | null {
  const exp = decodeToken(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

export function isTokenExpired(token: string, leewayMs = 0): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= Date.now() + leewayMs;
}

export function getUserFromToken(token: string): SessionUser | null {
  const payload = decodeToken(token);
  if (!payload || typeof payload.id !== "number" || typeof payload.username !== "string" || typeof payload.email !== "string") {
    return null;
  }

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : "",
    isAdmin: payload.isAdmin === true,
  };
}

let lastRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL_MS = 15_000; // Throttle to at most once every 15 seconds

/**
 * Refresh the current session once, shared by the proactive timer and the
 * fetch retry path. The in-flight lock prevents concurrent refresh storms,
 * and the cooldown throttles rapid repeated calls.
 */
export function refreshAuthSession(
  fetchImpl?: typeof fetch,
  tokenOverride?: string,
): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight;

  const token = tokenOverride || getStoredAuthToken();
  if (!token) return Promise.resolve({ ok: false, definitive: true });

  const now = Date.now();
  if (now - lastRefreshAttempt < MIN_REFRESH_INTERVAL_MS) {
    // If a refresh was attempted very recently, return the existing valid token without re-hitting the endpoint
    return Promise.resolve({ ok: true, token, user: getUserFromToken(token) ?? undefined });
  }

  lastRefreshAttempt = now;
  const requestFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  refreshInFlight = (async (): Promise<RefreshOutcome> => {
    try {
      const response = await requestFetch(`${getStudioApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return { ok: false, definitive: response.status === 401 || response.status === 403 };
      }

      const data = (await response.json()) as { token?: unknown; user?: SessionUser };
      if (typeof data.token !== "string" || !data.token) {
        return { ok: false, definitive: false };
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      window.dispatchEvent(new CustomEvent("clypra-auth-refreshed", { detail: data }));
      return { ok: true, token: data.token, user: data.user };
    } catch {
      return { ok: false, definitive: false };
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
