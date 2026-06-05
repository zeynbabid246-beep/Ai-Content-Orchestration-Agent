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
  platform: SocialPlatform;
  status: SocialAccountStatus;
  accountHandle: string;
  displayName: string;
  externalAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
  linkedChannelIds: number[];
}

export interface CreateSocialAccountRequest {
  platform: SocialPlatform;
  accountHandle: string;
  displayName: string;
  externalAccountId?: string;
}

export interface UpdateSocialAccountRequest {
  platform: SocialPlatform;
  status: SocialAccountStatus;
  accountHandle: string;
  displayName: string;
  externalAccountId?: string;
}
