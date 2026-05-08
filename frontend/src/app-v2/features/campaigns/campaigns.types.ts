export enum CampaignStatus {
  Draft = "Draft",
  Active = "Active",
  Paused = "Paused",
  Completed = "Completed",
  Archived = "Archived",
}

export interface Campaign {
  id: number;
  teamId: string;
  name: string;
  description: string | null;
  channelId: number | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  channelId?: number | null;
  status?: CampaignStatus;
}

export interface UpdateCampaignRequest {
  name: string;
  description?: string;
  channelId?: number | null;
  status: CampaignStatus;
}
