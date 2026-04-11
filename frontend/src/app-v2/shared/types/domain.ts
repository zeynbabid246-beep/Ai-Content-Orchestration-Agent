export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  voice: string;
  colors: {
    primary: string;
    secondary: string;
  };
  website: string;
  createdAt: string;
  ownerId: string;
}

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
