export enum CampaignStatus {
  Draft = 0,
  Active = 1,
  Paused = 2,
  Completed = 3,
  Archived = 4,
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
