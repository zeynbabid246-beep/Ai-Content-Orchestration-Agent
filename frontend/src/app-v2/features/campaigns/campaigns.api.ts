import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from "./campaigns.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getCampaigns(): Promise<Campaign[]> {
  const teamId = getTeamId();
  return apiRequest<Campaign[]>(`/teams/${teamId}/campaigns`, {
    requiresAuth: true,
  });
}

export async function getCampaignById(campaignId: number): Promise<Campaign> {
  const teamId = getTeamId();
  return apiRequest<Campaign>(`/teams/${teamId}/campaigns/${campaignId}`, {
    requiresAuth: true,
  });
}

export async function createCampaign(payload: CreateCampaignRequest): Promise<Campaign> {
  const teamId = getTeamId();
  return apiRequest<Campaign>(`/teams/${teamId}/campaigns`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateCampaign(campaignId: number, payload: UpdateCampaignRequest): Promise<Campaign> {
  const teamId = getTeamId();
  return apiRequest<Campaign>(`/teams/${teamId}/campaigns/${campaignId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function deleteCampaign(campaignId: number): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/campaigns/${campaignId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

export async function linkContentPostToCampaign(campaignId: number, contentPostId: number): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/campaigns/${campaignId}/content-post-links`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ contentPostId }),
  });
}

export async function unlinkContentPostFromCampaign(campaignId: number, contentPostId: number): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/campaigns/${campaignId}/content-post-links/${contentPostId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
