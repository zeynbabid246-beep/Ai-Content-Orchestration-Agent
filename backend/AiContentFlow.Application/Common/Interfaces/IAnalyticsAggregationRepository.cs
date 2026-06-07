namespace AiContentFlow.Application.Common.Interfaces;

public record AnalyticsSnapshotRow(
    int PublicationId,
    int ContentPostId,
    string? Title,
    string Platform,
    int Impressions,
    int Clicks,
    int Shares,
    decimal EngagementRate,
    DateTime PublishedAt,
    DateTime CollectedAt);

public interface IAnalyticsAggregationRepository
{
    Task<List<AnalyticsSnapshotRow>> GetLatestSnapshotsAsync(
        Guid teamId,
        DateTime sinceUtc,
        int? channelId = null,
        int? campaignId = null);
}
