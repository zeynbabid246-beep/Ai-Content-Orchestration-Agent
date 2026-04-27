import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, linkContentPostToCampaign, unlinkContentPostFromCampaign } from "./campaigns.api";
import type { CreateCampaignRequest, UpdateCampaignRequest } from "./campaigns.types";

export const campaignsKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignsKeys.all, "list"] as const,
  list: (filters: string) => [...campaignsKeys.lists(), { filters }] as const,
  details: () => [...campaignsKeys.all, "detail"] as const,
  detail: (id: number) => [...campaignsKeys.details(), id] as const,
};

export function useCampaigns() {
  return useQuery({
    queryKey: campaignsKeys.lists(),
    queryFn: getCampaigns,
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: campaignsKeys.detail(id),
    queryFn: () => getCampaignById(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCampaignRequest }) => updateCampaign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}

export function useLinkContentPostToCampaign() {
  return useMutation({
    mutationFn: ({ campaignId, contentPostId }: { campaignId: number; contentPostId: number }) => linkContentPostToCampaign(campaignId, contentPostId),
  });
}

export function useUnlinkContentPostFromCampaign() {
  return useMutation({
    mutationFn: ({ campaignId, contentPostId }: { campaignId: number; contentPostId: number }) => unlinkContentPostFromCampaign(campaignId, contentPostId),
  });
}
