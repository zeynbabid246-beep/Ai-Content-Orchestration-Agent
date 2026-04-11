export type PostPlatform = "LinkedIn" | "Blog" | "Instagram" | "Facebook";
export type PostStatus = "Ready" | "Scheduled" | "Draft" | "Published";

export interface DashboardPost {
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
