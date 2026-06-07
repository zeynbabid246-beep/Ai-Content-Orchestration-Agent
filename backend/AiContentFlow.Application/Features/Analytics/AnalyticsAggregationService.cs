using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Analytics.Dtos;

namespace AiContentFlow.Application.Features.Analytics;

public class AnalyticsAggregationService : IAnalyticsAggregationService
{
    private readonly IAnalyticsAggregationRepository _aggregationRepository;
    private readonly IChannelRepository _channelRepository;
    private readonly ICampaignRepository _campaignRepository;
    private readonly ITeamRepository _teamRepository;

    public AnalyticsAggregationService(
        IAnalyticsAggregationRepository aggregationRepository,
        IChannelRepository channelRepository,
        ICampaignRepository campaignRepository,
        ITeamRepository teamRepository)
    {
        _aggregationRepository = aggregationRepository;
        _channelRepository = channelRepository;
        _campaignRepository = campaignRepository;
        _teamRepository = teamRepository;
    }

    public Task<AnalyticsSummaryDto> GetTeamSummaryAsync(Guid teamId, string requestingUserId, int days = 30)
    {
        return GetSummaryAsync(teamId, requestingUserId, days);
    }

    public async Task<AnalyticsSummaryDto> GetChannelSummaryAsync(
        Guid teamId,
        int channelId,
        string requestingUserId,
        int days = 30)
    {
        await EnsureMemberAsync(teamId, requestingUserId);
        _ = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        return await BuildSummaryAsync(teamId, days, channelId, null);
    }

    public async Task<AnalyticsSummaryDto> GetCampaignSummaryAsync(
        Guid teamId,
        int channelId,
        int campaignId,
        string requestingUserId,
        int days = 30)
    {
        await EnsureMemberAsync(teamId, requestingUserId);
        _ = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");
        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        if (campaign.ChannelId != channelId)
            throw new KeyNotFoundException("Campaign not found");

        return await BuildSummaryAsync(teamId, days, channelId, campaignId);
    }

    private async Task<AnalyticsSummaryDto> GetSummaryAsync(Guid teamId, string requestingUserId, int days)
    {
        await EnsureMemberAsync(teamId, requestingUserId);
        return await BuildSummaryAsync(teamId, days, null, null);
    }

    private async Task<AnalyticsSummaryDto> BuildSummaryAsync(
        Guid teamId,
        int days,
        int? channelId,
        int? campaignId)
    {
        var normalizedDays = Math.Clamp(days, 1, 90);
        var sinceUtc = DateTime.UtcNow.Date.AddDays(-normalizedDays + 1);

        var snapshots = await _aggregationRepository.GetLatestSnapshotsAsync(
            teamId,
            sinceUtc,
            channelId,
            campaignId);

        if (snapshots.Count == 0)
        {
            return new AnalyticsSummaryDto(
                0,
                0,
                0,
                0m,
                [],
                BuildEmptyDailyTrend(normalizedDays),
                []);
        }

        var totalImpressions = snapshots.Sum(s => s.Impressions);
        var totalClicks = snapshots.Sum(s => s.Clicks);
        var totalShares = snapshots.Sum(s => s.Shares);
        var avgEngagement = snapshots.Count == 0
            ? 0m
            : Math.Round(snapshots.Average(s => s.EngagementRate), 2);

        var byPlatform = snapshots
            .GroupBy(s => s.Platform)
            .Select(group =>
            {
                var impressions = group.Sum(x => x.Impressions);
                var clicks = group.Sum(x => x.Clicks);
                var shares = group.Sum(x => x.Shares);
                return new PlatformMetricsDto(
                    group.Key,
                    impressions,
                    clicks,
                    shares,
                    impressions > 0
                        ? Math.Round(group.Average(x => x.EngagementRate), 2)
                        : 0m);
            })
            .OrderByDescending(x => x.Impressions)
            .ToList();

        var dailyTrend = snapshots
            .GroupBy(s => DateOnly.FromDateTime(s.CollectedAt.Date))
            .Select(group => new DailyMetricsDto(
                group.Key,
                group.Sum(x => x.Impressions),
                group.Sum(x => x.Clicks),
                group.Sum(x => x.Shares)))
            .ToDictionary(x => x.Date);

        var trend = new List<DailyMetricsDto>();
        for (var i = 0; i < normalizedDays; i++)
        {
            var date = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-normalizedDays + 1 + i));
            trend.Add(dailyTrend.TryGetValue(date, out var metrics)
                ? metrics
                : new DailyMetricsDto(date, 0, 0, 0));
        }

        var topPosts = snapshots
            .OrderByDescending(s => s.Impressions)
            .ThenByDescending(s => s.EngagementRate)
            .Take(10)
            .Select(s => new TopPostMetricsDto(
                s.PublicationId,
                s.ContentPostId,
                s.Title,
                s.Platform,
                s.Impressions,
                s.Clicks,
                s.Shares,
                s.EngagementRate,
                s.PublishedAt))
            .ToList();

        return new AnalyticsSummaryDto(
            totalImpressions,
            totalClicks,
            totalShares,
            avgEngagement,
            byPlatform,
            trend,
            topPosts);
    }

    private static IReadOnlyList<DailyMetricsDto> BuildEmptyDailyTrend(int days)
    {
        var trend = new List<DailyMetricsDto>();
        for (var i = 0; i < days; i++)
        {
            var date = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-days + 1 + i));
            trend.Add(new DailyMetricsDto(date, 0, 0, 0));
        }

        return trend;
    }

    private async Task EnsureMemberAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");
    }
}
