import type { DashboardPost, DashboardStat } from "./dashboard.types";

/**
 * Dashboard API layer.
 * Currently returns mock data. Replace with real API calls when backend endpoints are ready.
 */

export async function getDashboardPosts(): Promise<DashboardPost[]> {
  // TODO: Replace with apiRequest<DashboardPost[]>("/dashboard/posts", { requiresAuth: true })
  return [
    { title: "App Security Strategy", subtitle: "LinkedIn · 5 min read", platform: "LinkedIn", status: "Ready", date: "Mar 1" },
    { title: "Deployment Workflow", subtitle: "Blog · 7 min read", platform: "Blog", status: "Scheduled", date: "Mar 3" },
    { title: "UX Dashboard Redesign", subtitle: "Instagram · Visual", platform: "Instagram", status: "Draft", date: "Feb 28" },
    { title: "API Performance Deep Dive", subtitle: "Facebook · 9 min read", platform: "Facebook", status: "Published", date: "Feb 25" },
    { title: "Q2 Product Launch", subtitle: "LinkedIn · Campaign", platform: "LinkedIn", status: "Scheduled", date: "Apr 2" },
  ];
}

export async function getDashboardStats(): Promise<DashboardStat[]> {
  // TODO: Replace with apiRequest<DashboardStat[]>("/dashboard/stats", { requiresAuth: true })
  return [
    { value: "142", label: "Content Published", trend: "+12%", direction: "up" },
    { value: "8", label: "Active Campaigns", trend: "+3", direction: "up" },
    { value: "24", label: "Team Members", trend: null, direction: null },
    { value: "91k", label: "AI Tokens Used", trend: "67%", direction: "up" },
  ];
}
