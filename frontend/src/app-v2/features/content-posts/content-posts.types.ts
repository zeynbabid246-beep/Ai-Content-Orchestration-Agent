export enum ContentType {
  BlogPost = 0,
  TwitterThread = 1,
  LinkedInPost = 2,
  InstagramPost = 3,
  FacebookPost = 4,
}

export enum ContentStatus {
  Draft = 0,
  Ready = 1,
  Scheduled = 2,
  Published = 3,
  Deleted = 4,
}

export interface ContentPostVariant {
  platform: number;
  contentJson: string;
  title: string;
}

export interface ContentPost {
  id: number;
  teamId: string;
  channelId: number | null;
  socialAccountId: number | null;
  title: string;
  contentType: ContentType;
  contentJson: string;
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
  socialAccountId?: number | null;
  title: string;
  contentType: ContentType;
  contentJson: string;
  prompt?: string;
  aiModel?: string;
  aiTokens?: number;
  postVariants?: ContentPostVariant[];
}

export interface UpdateContentPostRequest {
  channelId?: number | null;
  socialAccountId?: number | null;
  title: string;
  contentType: ContentType;
  contentJson: string;
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
  scheduledAt: string;
}

export interface PublishContentPostRequest {
  platformPostId?: string;
  platformPostUrl?: string;
}
