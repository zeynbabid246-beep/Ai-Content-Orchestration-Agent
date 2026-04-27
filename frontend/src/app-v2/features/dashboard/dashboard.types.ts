export type PostPlatform = "LinkedIn" | "Blog" | "Instagram" | "Facebook";
export type PostStatus = "Ready" | "Scheduled" | "Draft" | "Published";

export interface DashboardPost {
  id: number;
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

export interface AudienceSegment {
  type: "Company" | "Individual";
  percentage: number;
}

export interface ActiveClient {
  name: string;
  type: "Company" | "Individual";
  interactions: number;
  avatar: string;
}

export interface PlatformAnalytics {
  name: string;
  color: string;
  followers: number;
  reach: number;
  engagement: number;
  comments: number;
  likes: number;
  shares: number;
  topAudience: AudienceSegment[];
  weeklyActivity: number[]; // 7 values Mon–Sun
  activeClients: ActiveClient[];
}

export interface AnalyticsData {
  platforms: PlatformAnalytics[];
  topChannel: string;
  weekDays: string[];
}