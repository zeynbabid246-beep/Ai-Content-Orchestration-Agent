import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { AnalyticsSummary } from "./analytics.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

function mapSummary(raw: AnalyticsSummary): AnalyticsSummary {
  return {
    totalImpressions: raw.totalImpressions,
    totalClicks: raw.totalClicks,
    totalShares: raw.totalShares,
    avgEngagementRate: raw.avgEngagementRate,
    byPlatform: raw.byPlatform ?? [],
    dailyTrend: raw.dailyTrend ?? [],
    topPosts: raw.topPosts ?? [],
  };
}

export async function getTeamAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const teamId = getTeamId();
  const response = await apiRequest<AnalyticsSummary>(
    `/teams/${teamId}/analytics/summary?days=${days}`,
    { requiresAuth: true }
  );
  return mapSummary(response);
}

export async function getChannelAnalyticsSummary(
  channelId: number,
  days = 30
): Promise<AnalyticsSummary> {
  const teamId = getTeamId();
  const response = await apiRequest<AnalyticsSummary>(
    `/teams/${teamId}/analytics/channels/${channelId}/summary?days=${days}`,
    { requiresAuth: true }
  );
  return mapSummary(response);
}

export async function getCampaignAnalyticsSummary(
  channelId: number,
  campaignId: number,
  days = 30
): Promise<AnalyticsSummary> {
  const teamId = getTeamId();
  const response = await apiRequest<AnalyticsSummary>(
    `/teams/${teamId}/analytics/channels/${channelId}/campaigns/${campaignId}/summary?days=${days}`,
    { requiresAuth: true }
  );
  return mapSummary(response);
}
