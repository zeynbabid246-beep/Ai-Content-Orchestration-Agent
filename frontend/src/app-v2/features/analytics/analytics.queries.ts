import { useQuery } from "@tanstack/react-query";
import {
  getCampaignAnalyticsSummary,
  getChannelAnalyticsSummary,
  getTeamAnalyticsSummary,
  getPlatformAnalyticsPosts,
} from "./analytics.api";

export const analyticsKeys = {
  all: ["analytics"] as const,
  team: (days: number) => [...analyticsKeys.all, "team", days] as const,
  channel: (channelId: number, days: number) =>
    [...analyticsKeys.all, "channel", channelId, days] as const,
  campaign: (channelId: number, campaignId: number, days: number) =>
    [...analyticsKeys.all, "campaign", channelId, campaignId, days] as const,
  platformPosts: (platform: string, days: number) =>
    [...analyticsKeys.all, "platform-posts", platform, days] as const,
};

export function useTeamAnalyticsSummary(days = 30) {
  return useQuery({
    queryKey: analyticsKeys.team(days),
    queryFn: () => getTeamAnalyticsSummary(days),
  });
}

export function useChannelAnalyticsSummary(channelId: number | null, days = 30) {
  return useQuery({
    queryKey: analyticsKeys.channel(channelId ?? 0, days),
    queryFn: () => getChannelAnalyticsSummary(channelId!, days),
    enabled: channelId != null && channelId > 0,
  });
}

export function usePlatformAnalyticsPosts(platform: string | null, days = 30) {
  return useQuery({
    queryKey: analyticsKeys.platformPosts(platform ?? "", days),
    queryFn: () => getPlatformAnalyticsPosts(platform!, days),
    enabled: platform != null && platform.length > 0,
  });
}

export function useCampaignAnalyticsSummary(
  channelId: number | null,
  campaignId: number | null,
  days = 30
) {
  return useQuery({
    queryKey: analyticsKeys.campaign(channelId ?? 0, campaignId ?? 0, days),
    queryFn: () => getCampaignAnalyticsSummary(channelId!, campaignId!, days),
    enabled: channelId != null && channelId > 0 && campaignId != null && campaignId > 0,
  });
}
