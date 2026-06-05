import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./auth.types";

type MessageResponse = { message: string };

function persistAuthResponse(response: AuthResponse) {
  authStorage.setTokens(response.accessToken, response.refreshToken);
  authStorage.setUser(String(response.userId), response.username, response.email ?? "");
  authStorage.setTeam(String(response.teamId), response.teamRole);
  authStorage.setTeamNameSetupRequired(Boolean(response.isTeamNameSetupRequired));
}

export async function login(payload: LoginRequest) {
  const response = await apiRequest<AuthResponse>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });

  persistAuthResponse(response);
  return response;
}

export async function register(payload: RegisterRequest) {
  const response = await apiRequest<AuthResponse>("/Auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: payload.username.trim(),
      email: payload.email.trim(),
      password: payload.password,
      teamName: payload.teamName?.trim() || undefined,
      inviteToken: payload.inviteToken || undefined,
    }),
  });

  persistAuthResponse(response);
  return response;
}

export async function forgotPassword(payload: { email: string }) {
  return apiRequest<MessageResponse>("/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: payload.email.trim() }),
  });
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  newPassword: string;
}) {
  return apiRequest<MessageResponse>("/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim(),
      token: payload.token,
      newPassword: payload.newPassword,
    }),
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest<MessageResponse>("/Auth/change-password", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  const refreshToken = authStorage.getRefreshToken();
  if (refreshToken) {
    try {
      await apiRequest<void>("/Auth/logout", {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Clear local session even if revoke fails
    }
  }
  authStorage.clear();
}

export async function acceptTeamInvitation(token: string) {
  return apiRequest<{ teamId: string; teamRole: string; teamName: string }>(
    "/Team/invitations/accept",
    {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({ token }),
    }
  );
}
