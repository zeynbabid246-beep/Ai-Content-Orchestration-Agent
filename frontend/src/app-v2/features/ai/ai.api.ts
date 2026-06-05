import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { ContentType } from "../content-posts/content-posts.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export type CampaignStepStatus = {
  step: string;
  status: string;
  id?: number | null;
  summary?: string | null;
  error?: string | null;
};

export type SuggestedCampaignPost = {
  title: string;
  contentJson: string;
  contentType: string;
  scheduledAt: string;
  platform: string;
};

export type GeneratePostResponse = {
  contentJson: string;
  modelUsed?: string | null;
  correlationId?: string | null;
};

export type SuggestCampaignResponse = {
  campaignName: string;
  description: string;
  strategy: CampaignStepStatus;
  planning: CampaignStepStatus;
  campaign: CampaignStepStatus;
  errors: string[];
  correlationId: string;
  posts: SuggestedCampaignPost[];
};

export type MaterializeCampaignPostInput = {
  title: string;
  contentJson: string;
  contentType: string;
  scheduledAt: string;
  platform: string;
};

export type MaterializeCampaignRequest = {
  channelId: number;
  goal: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  orgId?: string;
  theme?: string;
  language?: string;
  postsPerWeek?: number;
  customPrompt?: string;
  primaryPlatform?: string;
  runSuggest?: boolean;
  campaignName?: string;
  description?: string;
  posts?: MaterializeCampaignPostInput[];
  existingCampaignId?: number;
  schedulePosts?: boolean;
  socialAccountIdByPlatform?: Record<string, number>;
};

export type MaterializeCampaignResponse = {
  campaignId: number;
  contentPostIds: number[];
  correlationId: string;
  strategy: CampaignStepStatus;
  planning: CampaignStepStatus;
  campaign: CampaignStepStatus;
  errors: string[];
};

export type AiHealthResponse = {
  healthy: boolean;
  providerMode: string;
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

export type SuggestCampaignRequest = {
  channelId: number;
  goal: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  orgId?: string;
  theme?: string;
  language?: string;
  postsPerWeek?: number;
  customPrompt?: string;
  primaryPlatform?: string;
};

export type CampaignAiPipelineConfig = {
  channelId: number;
  goal: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  theme: string;
  language: string;
  postsPerWeek: number;
  customPrompt?: string;
  primaryPlatform?: string;
};

export type CampaignStrategyStepResponse = {
  strategyId: number | null;
  strategy: Record<string, unknown>;
  orgId: string;
  correlationId: string;
};

export type CampaignPlanningStepRequest = {
  config: CampaignAiPipelineConfig;
  strategyId: number;
  strategy: Record<string, unknown>;
};

export type CampaignPlanningStepResponse = {
  planningId: number | null;
  planning: Record<string, unknown>;
  correlationId: string;
};

export type CampaignContentStepRequest = {
  config: CampaignAiPipelineConfig;
  strategyId: number;
  strategy: Record<string, unknown>;
  planningId: number;
  planning: Record<string, unknown>;
};

export type CampaignContentStepResponse = {
  campaignId: number | null;
  campaign: Record<string, unknown>;
  posts: SuggestedCampaignPost[];
  campaignName: string;
  description: string;
  correlationId: string;
};

export async function generateCampaignStrategy(
  config: CampaignAiPipelineConfig
): Promise<CampaignStrategyStepResponse> {
  const teamId = getTeamId();
  return apiRequest<CampaignStrategyStepResponse>(`/teams/${teamId}/ai/campaigns/strategy`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(config),
  });
}

export async function generateCampaignPlanning(
  payload: CampaignPlanningStepRequest
): Promise<CampaignPlanningStepResponse> {
  const teamId = getTeamId();
  return apiRequest<CampaignPlanningStepResponse>(`/teams/${teamId}/ai/campaigns/planning`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function generateCampaignContent(
  payload: CampaignContentStepRequest
): Promise<CampaignContentStepResponse> {
  const teamId = getTeamId();
  return apiRequest<CampaignContentStepResponse>(`/teams/${teamId}/ai/campaigns/content`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function suggestCampaign(payload: SuggestCampaignRequest): Promise<SuggestCampaignResponse> {
  const teamId = getTeamId();
  return apiRequest<SuggestCampaignResponse>(`/teams/${teamId}/ai/campaigns/suggest`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function materializeCampaign(
  payload: MaterializeCampaignRequest
): Promise<MaterializeCampaignResponse> {
  const teamId = getTeamId();
  return apiRequest<MaterializeCampaignResponse>(`/teams/${teamId}/ai/campaigns/materialize`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function syncBrandToAi(): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/ai/sync-brand`, {
    method: "POST",
    requiresAuth: true,
  });
}

export async function getAiHealth(): Promise<AiHealthResponse> {
  const teamId = getTeamId();
  return apiRequest<AiHealthResponse>(`/teams/${teamId}/ai/health`, {
    requiresAuth: true,
  });
}

/** Map UI platform string to API content type enum name */
export function platformToContentType(platform: string): ContentType {
  switch (platform.toLowerCase()) {
    case "facebook":
      return "FacebookPost" as ContentType;
    case "instagram":
      return "InstagramPost" as ContentType;
    case "linkedin":
    default:
      return "LinkedInPost" as ContentType;
  }
}

export { formatGeneratedContentPreview, parsePostText, buildPostContentJson } from "../campaigns/lib/formatGeneratedContent";

export function formatAiError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("local ai") || msg.includes("connection") || msg.includes("circuit")) {
      return `${error.message} — ensure the AI backend is running (see backend/AI_BACKEND_SETUP.md).`;
    }
    return error.message;
  }
  return "AI request failed.";
}
