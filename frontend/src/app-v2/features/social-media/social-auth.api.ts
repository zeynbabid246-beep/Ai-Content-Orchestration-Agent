import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";

type SupportedSocialPlatform = "linkedin" | "facebook" | "instagram" | "threads";

interface SocialAuthLoginResult {
  teamId: string;
  linkChannelId?: number | null;
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

export async function getSocialAuthLoginUrl(
  platform: SupportedSocialPlatform,
  options?: { linkChannelId?: number; redirectPath?: string }
): Promise<string> {
  const teamId = getTeamId();
  const query = new URLSearchParams({ teamId });
  if (options?.linkChannelId) {
    query.set("linkChannelId", String(options.linkChannelId));
  }
  if (options?.redirectPath) {
    query.set("redirectPath", options.redirectPath);
  }
  const response = await apiRequest<SocialAuthLoginResult>(
    `/auth/${platform}/login?${query.toString()}`,
    { requiresAuth: true }
  );
  return response.authorizationUrl;
}
