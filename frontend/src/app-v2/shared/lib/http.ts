import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { env } from "./env";
import { authStorage } from "./storage";

const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_PATHS_WITHOUT_REFRESH = ["/Auth/login", "/Auth/register", "/Auth/refresh"];

let refreshInFlight: Promise<boolean> | null = null;

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
    const requestPath = originalRequest?.url ?? "";

    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !AUTH_PATHS_WITHOUT_REFRESH.some((path) => requestPath.includes(path));

    if (shouldAttemptRefresh) {
      originalRequest._retry = true;

      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const newToken = authStorage.getAccessToken();
        if (newToken && originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      }

      authStorage.clear();
      window.location.href = "/app/login";
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    if (error.response?.status === 403) {
      return Promise.reject(
        new Error("You do not have permission to perform this action.")
      );
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
  /** Request timeout in milliseconds (axios). Omit for no client-side limit. */
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, requiresAuth = false, timeoutMs } = options;

  const config: AxiosRequestConfig = {
    url: path,
    method,
    data: body ? JSON.parse(body) : undefined,
    ...(timeoutMs !== undefined ? { timeout: timeoutMs } : {}),
  };

  // If auth not required, strip the Authorization header for this request
  if (!requiresAuth) {
    config.headers = { Authorization: undefined };
  }
  // 204 No Content — axios returns empty string, normalise to null
  const response = await api.request<T>(config);
  return response.data ?? (null as T);
}

export async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  const token = authStorage.getAccessToken();
  const response = await api.request<T>({
    url: path,
    method,
    data: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data ?? (null as T);
}

// ─── Token refresh ────────────────────────────────────────────────────────────
async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = runRefreshWithLock();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function runRefreshWithLock(): Promise<boolean> {
  const executeRefresh = performTokenRefresh;

  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request("aicontentflow-token-refresh", executeRefresh);
  }

  return executeRefresh();
}

async function performTokenRefresh(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await axios.post<{
      accessToken: string;
      refreshToken: string;
    }>(
      `${env.apiBaseUrl}/Auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (!accessToken) return false;

    authStorage.setTokens(accessToken, newRefreshToken || refreshToken);
    return true;
  } catch {
    return false;
  }
}
