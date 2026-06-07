import type { DashboardPost, DashboardStat } from "./dashboard.types";
import type { AnalyticsSummary } from "../analytics/analytics.types";
import { getTeamAnalyticsSummary } from "../analytics/analytics.api";

import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import { getEffectiveContentStatus, toPostDisplayStatus } from "../content-posts/content-posts.display";
import { ContentStatus } from "../content-posts/content-posts.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getDashboardPosts(): Promise<DashboardPost[]> {
  const teamId = getTeamId();
  const posts = await apiRequest<any[]>(`/teams/${teamId}/content-posts`, {
    requiresAuth: true,
  });

  return posts.slice(0, 5).map(p => {
    let platformName = "Unknown";
    if (p.contentType === "TwitterThread") platformName = "X";
    else if (p.contentType === "LinkedInPost") platformName = "LinkedIn";
    else if (p.contentType === "InstagramPost") platformName = "Instagram";
    else if (p.contentType === "FacebookPost") platformName = "Facebook";
    else if (p.contentType === "BlogPost") platformName = "Blog";

    const statusName = toPostDisplayStatus(p);

    return {
      id: p.id,
      title: p.title || "Untitled",
      subtitle: p.prompt?.substring(0, 30) || "Generated via AI",
      platform: platformName as any,
      status: statusName as any,
      date: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  });
}

export async function getDashboardStats(): Promise<DashboardStat[]> {
  const teamId = getTeamId();
  const posts = await apiRequest<any[]>(`/teams/${teamId}/content-posts`, {
    requiresAuth: true,
  });

  const scheduledCount = posts.filter((p) => getEffectiveContentStatus(p) === ContentStatus.Scheduled).length;
  const publishedCount = posts.filter((p) => getEffectiveContentStatus(p) === ContentStatus.Published).length;

  let avgEngagement = "0";
  try {
    const analytics = await getTeamAnalyticsSummary(30);
    avgEngagement = `${analytics.avgEngagementRate.toFixed(1)}%`;
  } catch {
    avgEngagement = "0";
  }

  return [
    { value: posts.length.toString(), label: "Total Posts", trend: null, direction: null },
    { value: publishedCount.toString(), label: "Published Posts", trend: null, direction: null },
    { value: scheduledCount.toString(), label: "Scheduled Posts", trend: null, direction: null },
    { value: avgEngagement, label: "Avg. Engagement", trend: null, direction: null },
  ];
}

export async function getDashboardAnalytics(): Promise<AnalyticsSummary | null> {
  try {
    return await getTeamAnalyticsSummary(30);
  } catch {
    return null;
  }
}