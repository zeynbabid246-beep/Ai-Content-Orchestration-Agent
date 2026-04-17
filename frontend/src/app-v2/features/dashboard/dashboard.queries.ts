import { useQuery } from "@tanstack/react-query";
import { getDashboardPosts, getDashboardStats, getDashboardAnalytics } from "./dashboard.api";

const dashboardKeys = {
  posts: ["dashboard", "posts"] as const,
  stats: ["dashboard", "stats"] as const,
  analytics: ["dashboard", "analytics"] as const,
};

export function useDashboardPostsQuery() {
  return useQuery({
    queryKey: dashboardKeys.posts,
    queryFn: getDashboardPosts,
  });
}

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
  });
}

export function useDashboardAnalyticsQuery() {
  return useQuery({
    queryKey: dashboardKeys.analytics,
    queryFn: getDashboardAnalytics,
  });
}