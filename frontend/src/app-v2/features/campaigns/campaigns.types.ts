export enum CampaignStatus {
  Active = "Active",
  Archived = "Archived",
}

export interface CampaignPostSummary {
  draftCount: number;
  scheduledCount: number;
  publishedCount: number;
}

export interface Campaign {
  id: number;
  teamId: string;
  name: string;
  description: string | null;
  channelId: number | null;
  objective: string | null;
  toneOfVoiceOverride: string | null;
  targetAudienceOverride: string | null;
  status: CampaignStatus;
  postSummary?: CampaignPostSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  channelId?: number | null;
  objective?: string;
  toneOfVoiceOverride?: string;
  targetAudienceOverride?: string;
}

export interface UpdateCampaignRequest {
  name: string;
  description?: string;
  channelId?: number | null;
  objective?: string;
  toneOfVoiceOverride?: string;
  targetAudienceOverride?: string;
}
