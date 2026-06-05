using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class ContentPostRepository : IContentPostRepository
{
    private readonly AppDbContext _context;

    public ContentPostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ContentPost contentPost)
    {
        await _context.ContentPosts.AddAsync(contentPost);
    }

    public async Task<ContentPost?> GetByIdAsync(Guid teamId, int contentPostId)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .FirstOrDefaultAsync(cp => cp.TeamId == teamId 
                                    && cp.Id == contentPostId 
                                    && cp.Status != ContentStatus.Archived);
    }

    public async Task<List<ContentPost>> GetByTeamAsync(Guid teamId)
    {
        return await GetByTeamAsync(teamId, null, null, null);
    }

    public async Task<List<ContentPost>> GetByTeamAsync(
        Guid teamId,
        int? channelId,
        int? campaignId,
        ContentStatus? status)
    {
        var query = _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .Where(cp => cp.TeamId == teamId && cp.Status != ContentStatus.Archived);

        if (channelId.HasValue)
            query = query.Where(cp => cp.ChannelId == channelId.Value);

        if (campaignId.HasValue)
            query = query.Where(cp => cp.CampaignId == campaignId.Value);

        if (status.HasValue)
            query = query.Where(cp => cp.Status == status.Value);

        return await query
            .OrderByDescending(cp => cp.UpdatedAt)
            .ToListAsync();
    }

    public async Task<List<ContentPost>> GetByCampaignAsync(Guid teamId, int campaignId)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .Where(cp =>
                cp.TeamId == teamId &&
                cp.CampaignId == campaignId &&
                cp.Status != ContentStatus.Archived)
            .OrderByDescending(cp => cp.UpdatedAt)
            .ToListAsync();
    }

    public async Task<List<ContentPost>> GetByStatusAsync(Guid teamId, ContentStatus status)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .Where(p => p.TeamId == teamId && p.Status == status)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ContentPost>> GetScheduledAsync(Guid teamId)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .Where(p => p.TeamId == teamId && p.Status == ContentStatus.Scheduled)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<List<ContentPost>> GetDeletedAsync(Guid teamId)
    {
        return await _context.ContentPosts
            .Where(p => p.TeamId == teamId && p.Status == ContentStatus.Archived)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<ContentPost> UpdateAsync(ContentPost post)
    {
        _context.ContentPosts.Update(post);
        return post;  
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}