using AiContentFlow.Application.Common.Interfaces;
using System.Security.Cryptography;
using System.Text;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Workers;

public class SyncPublicationAnalyticsJob
{
    private const int BatchSize = 50;
    private readonly IPostPublicationRepository _publicationRepository;
    private readonly IPublicationAnalyticsRepository _analyticsRepository;
    private readonly ILogger<SyncPublicationAnalyticsJob> _logger;

    public SyncPublicationAnalyticsJob(
        IPostPublicationRepository publicationRepository,
        IPublicationAnalyticsRepository analyticsRepository,
        ILogger<SyncPublicationAnalyticsJob> logger)
    {
        _publicationRepository = publicationRepository;
        _analyticsRepository = analyticsRepository;
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
                var publishedAt = publication.PublishedAt ?? DateTime.UtcNow;
                var source = publication.SocialAccount?.Platform.ToString() ?? "unknown";
                var dedupeKey = BuildDedupeKey(publication.TeamId, publication.Id, source, publishedAt, DateTime.UtcNow.Date);
                if (await _analyticsRepository.ExistsByDedupeKeyAsync(publication.TeamId, dedupeKey))
                    continue;

                await _analyticsRepository.AddAsync(new PublicationAnalytics
                {
                    TeamId = publication.TeamId,
                    PostPublicationId = publication.Id,
                    Source = source,
                    DedupeKey = dedupeKey,
                    WindowStart = publishedAt,
                    WindowEnd = DateTime.UtcNow,
                    PlatformCollectedAt = DateTime.UtcNow,
                    MetricVersion = "initial",
                    CollectedAt = DateTime.UtcNow
                });
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
