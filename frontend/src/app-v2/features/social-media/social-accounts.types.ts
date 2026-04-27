export enum SocialPlatform {
  Facebook = 0,
  LinkedIn = 1,
  Instagram = 2,
  X = 3,
  Threads = 4,
  TikTok = 5,
}

export enum SocialAccountStatus {
  Active = 0,
  Disconnected = 1,
  Error = 2,
}

export interface SocialAccount {
  id: number;
  teamId: string;
  channelId: number;
  platform: SocialPlatform;
  status: SocialAccountStatus;
  accountHandle: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialAccountRequest {
  channelId: number;
  platform: SocialPlatform;
  accountHandle: string;
  displayName: string;
}

export interface UpdateSocialAccountRequest {
  channelId: number;
  platform: SocialPlatform;
  status: SocialAccountStatus;
  accountHandle: string;
  displayName: string;
}
