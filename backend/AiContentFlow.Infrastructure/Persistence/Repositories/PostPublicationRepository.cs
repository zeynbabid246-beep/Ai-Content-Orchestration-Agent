using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class PostPublicationRepository : IPostPublicationRepository
{
    private readonly AppDbContext _context;

    public PostPublicationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(PostPublication publication)
    {
        await _context.PostPublications.AddAsync(publication);
    }

    public async Task<PostPublication?> GetByIdAsync(Guid teamId, int publicationId)
    {
        return await _context.PostPublications
            .FirstOrDefaultAsync(p => p.TeamId == teamId && p.Id == publicationId);
    }

    public async Task<PostPublication?> GetByIdempotencyKeyAsync(Guid teamId, string idempotencyKey)
    {
        return await _context.PostPublications
            .FirstOrDefaultAsync(p => p.TeamId == teamId && p.IdempotencyKey == idempotencyKey);
    }

    public async Task<PostPublication?> GetActiveByIntentAsync(
        Guid teamId,
        int contentPostId,
        int socialAccountId,
        int? postVariantId,
        DateTime? scheduledAt)
    {
        return await _context.PostPublications
            .Where(p => p.TeamId == teamId
                        && p.ContentPostId == contentPostId
                        && p.SocialAccountId == socialAccountId
                        && p.PostVariantId == postVariantId
                        && p.ScheduledAt == scheduledAt
                        && p.Status != PublicationStatus.Cancelled
                        && p.Status != PublicationStatus.Failed)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<PostPublication>> GetPendingByContentPostAsync(Guid teamId, int contentPostId)
    {
        return await _context.PostPublications
            .Include(p => p.PublishJobs)
            .Where(p => p.TeamId == teamId
                        && p.ContentPostId == contentPostId
                        && (p.Status == PublicationStatus.Scheduled
                            || p.Status == PublicationStatus.Queued))
            .ToListAsync();
    }

    public async Task<List<PostPublication>> GetByTeamAsync(Guid teamId)
    {
        return await _context.PostPublications
            .Where(p => p.TeamId == teamId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<PostPublication>> GetPublishedNeedingAnalyticsAsync(DateTime utcNow, int batchSize)
    {
        var cutoff = utcNow.AddMinutes(-15);
        return await _context.PostPublications
            .Include(p => p.SocialAccount)
            .Where(p => p.Status == PublicationStatus.Published
                        && p.PublishedAt != null
                        && p.PublishedAt <= cutoff)
            .OrderBy(p => p.PublishedAt)
            .Take(batchSize)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
