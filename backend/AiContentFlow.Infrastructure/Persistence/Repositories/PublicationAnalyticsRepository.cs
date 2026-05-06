using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class PublicationAnalyticsRepository : IPublicationAnalyticsRepository
{
    private readonly AppDbContext _context;

    public PublicationAnalyticsRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(PublicationAnalytics analytics)
    {
        await _context.PublicationAnalytics.AddAsync(analytics);
    }

    public async Task<bool> ExistsByDedupeKeyAsync(Guid teamId, string dedupeKey)
    {
        return await _context.PublicationAnalytics
            .AnyAsync(a => a.TeamId == teamId && a.DedupeKey == dedupeKey);
    }

    public async Task<List<PublicationAnalytics>> GetByPublicationAsync(Guid teamId, int publicationId)
    {
        return await _context.PublicationAnalytics
            .Where(a => a.TeamId == teamId && a.PostPublicationId == publicationId)
            .OrderByDescending(a => a.CollectedAt)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
