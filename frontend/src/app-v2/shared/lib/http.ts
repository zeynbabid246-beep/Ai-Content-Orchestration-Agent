import { env } from "./env";
import { authStorage } from "./storage";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = false, headers, ...rest } = options;
  const finalHeaders = new Headers(headers ?? {});

  if (!finalHeaders.has("Content-Type") && rest.body) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = authStorage.getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (response.status === 401 && requiresAuth) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      const retryHeaders = new Headers(finalHeaders);
      const newToken = authStorage.getAccessToken();
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryResponse = await fetch(`${env.apiBaseUrl}${path}`, { ...rest, headers: retryHeaders });
      return handleResponse<T>(retryResponse);
    } else {
      authStorage.clear();
      window.location.href = "/app/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return null as T;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data as { message?: string; error?: string } | null)?.message ??
      (data as { message?: string; error?: string } | null)?.error ??
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    // env.apiBaseUrl already includes /api, so just append /Auth/refresh
    const response = await fetch(`${env.apiBaseUrl}/Auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    // Backend returns camelCase JSON
    if (data?.accessToken) {
      authStorage.setTokens(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}