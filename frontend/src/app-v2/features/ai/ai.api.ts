import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export type GeneratePostResponse = {
  contentJson: string;
  modelUsed?: string | null;
};

export type SuggestCampaignResponse = {
  campaignName: string;
  description: string;
  strategy: {
    step: string;
    status: string;
    id?: number | null;
    summary?: string | null;
    error?: string | null;
  };
  planning: {
    step: string;
    status: string;
    id?: number | null;
    summary?: string | null;
    error?: string | null;
  };
  campaign: {
    step: string;
    status: string;
    id?: number | null;
    summary?: string | null;
    error?: string | null;
  };
  errors: string[];
  correlationId: string;
  posts: Array<{
    title: string;
    contentJson: string;
    contentType: string;
    scheduledAt: string;
    platform: string;
  }>;
};

export async function generatePost(payload: {
  prompt: string;
  model?: string;
  channelId?: number;
  campaignId?: number;
  useBrandContext?: boolean;
  platform?: string;
  format?: "post" | "carousel";
}): Promise<GeneratePostResponse> {
  const teamId = getTeamId();
  return apiRequest<GeneratePostResponse>(`/teams/${teamId}/ai/generate-post`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function suggestCampaign(payload: {
  channelId: number;
  goal: string;
  startDate: string;
  endDate: string;
  platforms: string[];
}): Promise<SuggestCampaignResponse> {
  const teamId = getTeamId();
  return apiRequest<SuggestCampaignResponse>(`/teams/${teamId}/ai/campaigns/suggest`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}
