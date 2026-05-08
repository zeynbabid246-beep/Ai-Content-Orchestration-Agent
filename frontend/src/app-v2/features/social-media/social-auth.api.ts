import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";

type SupportedSocialPlatform = "linkedin" | "facebook";

interface SocialAuthLoginResult {
  teamId: string;
  channelId: number;
  platform: string;
  authorizationUrl: string;
}

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) {
    throw new Error("No team found. Please log in again.");
  }
  return teamId;
}

export async function getSocialAuthLoginUrl(platform: SupportedSocialPlatform, channelId?: number): Promise<string> {
  const teamId = getTeamId();
  const query = new URLSearchParams({ teamId });
  if (channelId) {
    query.set("channelId", String(channelId));
  }
  const response = await apiRequest<SocialAuthLoginResult>(
    `/auth/${platform}/login?${query.toString()}`,
    { requiresAuth: true }
  );
  return response.authorizationUrl;
}
