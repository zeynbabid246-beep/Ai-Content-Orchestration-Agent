using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class AnalyticsAggregationRepository : IAnalyticsAggregationRepository
{
    private readonly AppDbContext _context;

    public AnalyticsAggregationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AnalyticsSnapshotRow>> GetLatestSnapshotsAsync(
        Guid teamId,
        DateTime sinceUtc,
        int? channelId = null,
        int? campaignId = null)
    {
        var query =
            from analytics in _context.PublicationAnalytics.AsNoTracking()
            join publication in _context.PostPublications.AsNoTracking()
                on analytics.PostPublicationId equals publication.Id
            join post in _context.ContentPosts.AsNoTracking()
                on publication.ContentPostId equals post.Id
            join account in _context.SocialAccounts.AsNoTracking()
                on publication.SocialAccountId equals account.Id
            where analytics.TeamId == teamId
                  && analytics.CollectedAt >= sinceUtc
                  && publication.Status == PublicationStatus.Published
            select new
            {
                analytics,
                publication,
                post,
                account
            };

        if (channelId.HasValue)
            query = query.Where(x => x.post.ChannelId == channelId.Value);

        if (campaignId.HasValue)
            query = query.Where(x => x.post.CampaignId == campaignId.Value);

        var rows = await query.ToListAsync();

        return rows
            .GroupBy(x => x.publication.Id)
            .Select(group =>
            {
                var latest = group.OrderByDescending(x => x.analytics.CollectedAt).First();
                return new AnalyticsSnapshotRow(
                    latest.publication.Id,
                    latest.post.Id,
                    latest.post.Title,
                    latest.account.Platform.ToString(),
                    latest.analytics.Impressions,
                    latest.analytics.Clicks,
                    latest.analytics.Shares,
                    latest.analytics.EngagementRate,
                    latest.publication.PublishedAt ?? latest.analytics.CollectedAt,
                    latest.analytics.CollectedAt);
            })
            .ToList();
    }
}
