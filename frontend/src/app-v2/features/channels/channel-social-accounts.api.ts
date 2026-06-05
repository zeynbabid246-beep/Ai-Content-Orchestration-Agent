import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { SocialAccount } from "../social-media/social-accounts.types";

export interface ChannelSocialAccountsPayload {
  linkedAccounts: SocialAccount[];
  availableTeamAccounts: SocialAccount[];
}

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) {
    throw new Error("No team found. Please log in again.");
  }
  return teamId;
}

export async function getChannelSocialAccounts(channelId: number): Promise<ChannelSocialAccountsPayload> {
  const teamId = getTeamId();
  return apiRequest<ChannelSocialAccountsPayload>(
    `/teams/${teamId}/channels/${channelId}/social-accounts`,
    { requiresAuth: true }
  );
}

export async function linkChannelSocialAccount(
  channelId: number,
  socialAccountId: number
): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/channels/${channelId}/social-accounts/link`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ socialAccountId }),
  });
}

export async function unlinkChannelSocialAccount(
  channelId: number,
  socialAccountId: number
): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(
    `/teams/${teamId}/channels/${channelId}/social-accounts/${socialAccountId}`,
    { method: "DELETE", requiresAuth: true }
  );
}
