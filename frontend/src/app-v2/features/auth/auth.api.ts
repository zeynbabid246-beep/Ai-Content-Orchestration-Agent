import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./auth.types";

export async function login(payload: LoginRequest) {
  const response = await apiRequest<AuthResponse>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({
      Email: payload.email.trim(),
      Password: payload.password,
    }),
  });

  // Backend returns camelCase JSON
  authStorage.setTokens(response.accessToken, response.refreshToken);
  authStorage.setUser(String(response.userId), response.username);
  authStorage.setTeam(String(response.teamId), response.teamRole);
  return response;
}

export async function register(payload: RegisterRequest) {
  const response = await apiRequest<AuthResponse>("/Auth/register", {
    method: "POST",
    body: JSON.stringify({
      Username: payload.username.trim(),
      Email: payload.email.trim(),
      Password: payload.password,
    }),
  });

  // Backend returns camelCase JSON
  authStorage.setTokens(response.accessToken, response.refreshToken);
  authStorage.setUser(String(response.userId), response.username);
  authStorage.setTeam(String(response.teamId), response.teamRole);
  return response;
}