export interface PlatformMetrics {
  platform: string;
  impressions: number;
  clicks: number;
  shares: number;
  engagementRate: number;
}

export interface DailyMetrics {
  date: string;
  impressions: number;
  clicks: number;
  shares: number;
}

export interface TopPostMetrics {
  publicationId: number;
  contentPostId: number;
  title: string | null;
  platform: string;
  impressions: number;
  clicks: number;
  shares: number;
  engagementRate: number;
  publishedAt: string;
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalShares: number;
  avgEngagementRate: number;
  byPlatform: PlatformMetrics[];
  dailyTrend: DailyMetrics[];
  topPosts: TopPostMetrics[];
}
