using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Analytics.Dtos;

namespace AiContentFlow.Application.Features.Analytics;

public interface IAnalyticsAggregationService
{
    Task<AnalyticsSummaryDto> GetTeamSummaryAsync(Guid teamId, string requestingUserId, int days = 30);

    Task<AnalyticsSummaryDto> GetChannelSummaryAsync(
        Guid teamId,
        int channelId,
        string requestingUserId,
        int days = 30);

    Task<AnalyticsSummaryDto> GetCampaignSummaryAsync(
        Guid teamId,
        int channelId,
        int campaignId,
        string requestingUserId,
        int days = 30);
}
