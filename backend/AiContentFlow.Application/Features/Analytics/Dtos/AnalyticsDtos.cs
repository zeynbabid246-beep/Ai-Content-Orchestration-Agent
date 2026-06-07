namespace AiContentFlow.Application.Features.Analytics.Dtos;

public record RecordPublicationAnalyticsDto(
    int PublicationId,
    string Source,
    DateTime WindowStart,
    DateTime WindowEnd,
    DateTime? PlatformCollectedAt,
    string? MetricVersion,
    int Impressions,
    int Clicks,
    int Shares,
    decimal EngagementRate);

public record PublicationAnalyticsResponseDto(
    int Id,
    Guid TeamId,
    int PublicationId,
    string Source,
    string DedupeKey,
    DateTime WindowStart,
    DateTime WindowEnd,
    int Impressions,
    int Clicks,
    int Shares,
    decimal EngagementRate,
    DateTime CollectedAt);

public record PlatformMetricsDto(
    string Platform,
    int Impressions,
    int Clicks,
    int Shares,
    decimal EngagementRate);

public record DailyMetricsDto(
    DateOnly Date,
    int Impressions,
    int Clicks,
    int Shares);

public record TopPostMetricsDto(
    int PublicationId,
    int ContentPostId,
    string? Title,
    string Platform,
    int Impressions,
    int Clicks,
    int Shares,
    decimal EngagementRate,
    DateTime PublishedAt);

public record AnalyticsSummaryDto(
    int TotalImpressions,
    int TotalClicks,
    int TotalShares,
    decimal AvgEngagementRate,
    IReadOnlyList<PlatformMetricsDto> ByPlatform,
    IReadOnlyList<DailyMetricsDto> DailyTrend,
    IReadOnlyList<TopPostMetricsDto> TopPosts);
