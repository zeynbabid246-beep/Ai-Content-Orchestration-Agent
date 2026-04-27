import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { 
  SocialAccount, 
  CreateSocialAccountRequest, 
  UpdateSocialAccountRequest 
} from "./social-accounts.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  const teamId = getTeamId();
  return apiRequest<SocialAccount[]>(`/teams/${teamId}/social-accounts`, {
    requiresAuth: true,
  });
}

export async function getSocialAccountById(id: number): Promise<SocialAccount> {
  const teamId = getTeamId();
  return apiRequest<SocialAccount>(`/teams/${teamId}/social-accounts/${id}`, {
    requiresAuth: true,
  });
}

export async function createSocialAccount(payload: CreateSocialAccountRequest): Promise<SocialAccount> {
  const teamId = getTeamId();
  return apiRequest<SocialAccount>(`/teams/${teamId}/social-accounts`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateSocialAccount(id: number, payload: UpdateSocialAccountRequest): Promise<SocialAccount> {
  const teamId = getTeamId();
  return apiRequest<SocialAccount>(`/teams/${teamId}/social-accounts/${id}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function deleteSocialAccount(id: number): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/social-accounts/${id}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
