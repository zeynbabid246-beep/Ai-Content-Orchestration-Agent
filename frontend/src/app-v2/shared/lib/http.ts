import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { env } from "./env";
import { authStorage } from "./storage";

const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor — attach Bearer token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — handle 401 + token refresh ───────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const newToken = authStorage.getAccessToken();
        if (newToken && originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } else {
        authStorage.clear();
        window.location.href = "/app/login";
        return Promise.reject(new Error("Session expired. Please log in again."));
      }
    }

    // Backend ExceptionMiddleware returns { message: string, errors: [] }
    const message =
      (error.response?.data as { message?: string } | null)?.message ??
      `Request failed: ${error.response?.status ?? "unknown"}`;

    return Promise.reject(new Error(message));
  }
);

// ─── Public request function ──────────────────────────────────────────────────
interface RequestOptions {
  method?: string;
  body?: string;
  requiresAuth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, requiresAuth = false } = options;

  const config: AxiosRequestConfig = {
    url: path,
    method,
    data: body ? JSON.parse(body) : undefined,
  };

  // If auth not required, strip the Authorization header for this request
  if (!requiresAuth) {
    config.headers = { Authorization: undefined };
  }

<<<<<<< HEAD
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
=======
  // 204 No Content — axios returns empty string, normalise to null
  const response = await api.request<T>(config);
  return response.data ?? (null as T);
>>>>>>> a83e84e8 (just done)
}

// ─── Token refresh ────────────────────────────────────────────────────────────
async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${env.apiBaseUrl}/Auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    const { accessToken, refreshToken: newRefresh } = response.data;
    if (accessToken) {
      authStorage.setTokens(accessToken, newRefresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}