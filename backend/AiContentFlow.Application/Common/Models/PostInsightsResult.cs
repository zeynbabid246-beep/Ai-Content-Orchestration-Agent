namespace AiContentFlow.Application.Common.Models;

public record PostInsightsResult(
    int Impressions,
    int Clicks,
    int Shares,
    decimal EngagementRate);
