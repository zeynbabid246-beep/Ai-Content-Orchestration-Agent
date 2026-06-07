import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAiHealth,
  generateCampaignStrategy,
  generateCampaignPlanning,
  generateCampaignContent,
  type CampaignAiPipelineConfig,
  type CampaignPlanningStepRequest,
  type CampaignContentStepRequest,
  type CampaignStrategyStepResponse,
  type CampaignPlanningStepResponse,
  type CampaignContentStepResponse,
  type AiHealthResponse,
} from "./ai.api";
import { bulkCreateCampaignPosts } from "../campaigns/campaigns.api";
import { campaignsKeys } from "../campaigns/campaigns.queries";

export const aiKeys = {
  health: ["ai", "health"] as const,
};

export function useAiHealth() {
  return useQuery<AiHealthResponse>({
    queryKey: aiKeys.health,
    queryFn: getAiHealth,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useGenerateCampaignStrategy() {
  return useMutation<CampaignStrategyStepResponse, Error, CampaignAiPipelineConfig>({
    mutationFn: generateCampaignStrategy,
  });
}

export function useGenerateCampaignPlanning() {
  return useMutation<CampaignPlanningStepResponse, Error, CampaignPlanningStepRequest>({
    mutationFn: generateCampaignPlanning,
  });
}

export function useGenerateCampaignContent() {
  return useMutation<CampaignContentStepResponse, Error, CampaignContentStepRequest>({
    mutationFn: generateCampaignContent,
  });
}

export function useBulkCreateCampaignPosts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      posts,
    }: {
      campaignId: number;
      posts: Parameters<typeof bulkCreateCampaignPosts>[1];
    }) => bulkCreateCampaignPosts(campaignId, posts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
    },
  });
}
