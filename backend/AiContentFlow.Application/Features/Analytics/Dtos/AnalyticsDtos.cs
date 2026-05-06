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
