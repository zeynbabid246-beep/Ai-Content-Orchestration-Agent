export enum SocialPlatform {
  Facebook = "Facebook",
  LinkedIn = "LinkedIn",
  Instagram = "Instagram",
  X = "X",
  Threads = "Threads",
  TikTok = "TikTok",
}

export enum SocialAccountStatus {
  Active = "Active",
  Disconnected = "Disconnected",
}

export interface SocialAccount {
  id: number;
  teamId: string;
  channelId: number;
  platform: SocialPlatform;
  status: SocialAccountStatus;
  accountHandle: string;
  displayName: string;
  externalAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialAccountRequest {
  channelId: number;
  platform: SocialPlatform;
  accountHandle: string;
  displayName: string;
  externalAccountId?: string;
}

export interface UpdateSocialAccountRequest {
  channelId: number;
  platform: SocialPlatform;
  status: SocialAccountStatus;
  accountHandle: string;
  displayName: string;
  externalAccountId?: string;
}
