export enum ContentType {
  BlogPost = "BlogPost",
  TwitterThread = "TwitterThread",
  LinkedInPost = "LinkedInPost",
  InstagramPost = "InstagramPost",
  FacebookPost = "FacebookPost",
}

export enum ContentStatus {
  Draft = "Draft",
  Ready = "Ready",
  Scheduled = "Scheduled",
  Published = "Published",
  Deleted = "Deleted",
}

export enum SocialPlatform {
  Facebook = "Facebook",
  LinkedIn = "LinkedIn",
  Instagram = "Instagram",
  X = "X",
  Threads = "Threads",
  TikTok = "TikTok",
}

export interface ContentPostVariant {
  platform: SocialPlatform;
  contentJson: string;
  title: string;
}

export interface ContentPost {
  id: number;
  teamId: string;
  channelId: number | null;
  campaignId?: number | null;
  campaignName?: string | null;
  socialAccountId: number | null;
  title: string;
  contentType: ContentType;
  contentJson: string;
  imageUrl?: string | null;
  status: ContentStatus;
  prompt: string;
  aiModel: string;
  aiTokens: number;
  postVariants: ContentPostVariant[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentPostRequest {
  channelId?: number | null;
  campaignId?: number | null;
  socialAccountId?: number | null;
  title: string;
  contentType: ContentType;
  contentJson: string;
  imageUrl?: string | null;
  prompt?: string;
  aiModel?: string;
  aiTokens?: number;
  postVariants?: ContentPostVariant[];
}

export interface UpdateContentPostRequest {
  channelId?: number | null;
  campaignId?: number | null;
  socialAccountId?: number | null;
  title: string;
  contentType: ContentType;
  contentJson: string;
  imageUrl?: string | null;
  status?: ContentStatus;
  prompt?: string;
  aiModel?: string;
  aiTokens?: number;
  postVariants?: ContentPostVariant[];
}

export interface TransitionContentPostStatusRequest {
  status: ContentStatus;
}

export interface ScheduleContentPostRequest {
  socialAccountId: number;
  postVariantId?: number | null;
  scheduledAt: string;
  idempotencyKey?: string;
}

export interface PublishContentPostRequest {
  socialAccountId: number;
  postVariantId?: number | null;
  idempotencyKey?: string;
}
