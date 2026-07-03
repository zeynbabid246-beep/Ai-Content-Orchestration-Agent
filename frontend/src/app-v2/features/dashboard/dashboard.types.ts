export type PostPlatform = "LinkedIn" | "Blog" | "Instagram" | "Facebook";
export type PostStatus = "Draft" | "Scheduled" | "Published" | "Deleted";

export interface DashboardPost {
  id: number;
  channelId: number | null;
  campaignId: number | null;
  title: string;
  subtitle: string;
  platform: PostPlatform;
  status: PostStatus;
  date: string;
}

export interface DashboardStat {
  value: string;
  label: string;
  trend: string | null;
  direction: "up" | "down" | null;
}
