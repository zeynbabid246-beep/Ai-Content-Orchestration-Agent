export type PostStatus = "draft" | "scheduled" | "published";

export interface Post {
  id: string;
  platformTargets: string[];
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: {
    impressions?: number;
    clicks?: number;
    engagementRate?: number;
  };
}
