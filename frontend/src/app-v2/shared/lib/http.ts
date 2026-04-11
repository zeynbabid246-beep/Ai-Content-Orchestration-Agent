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

  // Handle 401 — attempt token refresh or force logout
  if (response.status === 401 && requiresAuth) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry the original request with the new token
      const retryHeaders = new Headers(finalHeaders);
      const newToken = authStorage.getAccessToken();
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryResponse = await fetch(`${env.apiBaseUrl}${path}`, { ...rest, headers: retryHeaders });
      return handleResponse<T>(retryResponse);
    } else {
      // Refresh failed — force logout
      authStorage.clear();
      window.location.href = "/app/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
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
    const response = await fetch(`${env.apiBaseUrl}/Auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RefreshToken: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data?.AccessToken) {
      authStorage.setTokens(data.AccessToken, data.RefreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
