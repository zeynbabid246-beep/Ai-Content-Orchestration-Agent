using System.Security.Cryptography;
using System.Text;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Workers;

public class SyncPublicationAnalyticsJob
{
    private const int BatchSize = 50;
    private readonly IPostPublicationRepository _publicationRepository;
    private readonly IPublicationAnalyticsRepository _analyticsRepository;
    private readonly IInsightsProviderFactory _insightsProviderFactory;
    private readonly ILogger<SyncPublicationAnalyticsJob> _logger;

    public SyncPublicationAnalyticsJob(
        IPostPublicationRepository publicationRepository,
        IPublicationAnalyticsRepository analyticsRepository,
        IInsightsProviderFactory insightsProviderFactory,
        ILogger<SyncPublicationAnalyticsJob> logger)
    {
        _publicationRepository = publicationRepository;
        _analyticsRepository = analyticsRepository;
        _insightsProviderFactory = insightsProviderFactory;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var publications = await _publicationRepository.GetPublishedNeedingAnalyticsAsync(DateTime.UtcNow, BatchSize);

        foreach (var publication in publications)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                if (string.IsNullOrWhiteSpace(publication.ExternalPostId))
                    continue;

                var account = publication.SocialAccount;
                if (account == null)
                    continue;

                var provider = _insightsProviderFactory.GetProvider(account.Platform);
                if (provider == null)
                {
                    _logger.LogDebug(
                        "No insights provider for platform {Platform} (publication {PublicationId})",
                        account.Platform,
                        publication.Id);
                    continue;
                }

                var insights = await provider.FetchPostInsightsAsync(publication, account, cancellationToken);
                if (insights == null)
                    continue;

                var publishedAt = publication.PublishedAt ?? DateTime.UtcNow;
                var source = account.Platform.ToString();
                var dedupeKey = BuildDedupeKey(publication.TeamId, publication.Id, source, publishedAt, DateTime.UtcNow.Date);
                var now = DateTime.UtcNow;

                var existing = await _analyticsRepository.GetByDedupeKeyAsync(publication.TeamId, dedupeKey);
                if (existing != null)
                {
                    // Update the existing daily record with fresh metrics
                    existing.Impressions = insights.Impressions;
                    existing.Clicks = insights.Clicks;
                    existing.Shares = insights.Shares;
                    existing.EngagementRate = insights.EngagementRate;
                    existing.WindowEnd = now;
                    existing.PlatformCollectedAt = now;
                    existing.CollectedAt = now;
                }
                else
                {
                    await _analyticsRepository.AddAsync(new PublicationAnalytics
                    {
                        TeamId = publication.TeamId,
                        PostPublicationId = publication.Id,
                        Source = source,
                        DedupeKey = dedupeKey,
                        WindowStart = publishedAt,
                        WindowEnd = now,
                        PlatformCollectedAt = now,
                        MetricVersion = "platform-v1",
                        Impressions = insights.Impressions,
                        Clicks = insights.Clicks,
                        Shares = insights.Shares,
                        EngagementRate = insights.EngagementRate,
                        CollectedAt = now
                    });
                }
                await _analyticsRepository.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to sync analytics for publication {PublicationId}", publication.Id);
            }
        }
    }

    private static string BuildDedupeKey(Guid teamId, int publicationId, string source, DateTime windowStart, DateTime bucket)
    {
        var raw = $"{teamId:N}:{publicationId}:{source}:{windowStart:O}:{bucket:yyyy-MM-dd}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    }
}
