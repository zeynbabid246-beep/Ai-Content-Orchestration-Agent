using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Campaigns.Dtos;
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
            .Include(cp => cp.Publications)
            .Include(cp => cp.Campaign)
            .FirstOrDefaultAsync(cp => cp.TeamId == teamId 
                                    && cp.Id == contentPostId 
                                    && cp.Status != ContentStatus.Deleted);
    }

    public async Task<ContentPost?> GetByIdIncludingDeletedAsync(Guid teamId, int contentPostId)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .Include(cp => cp.Publications)
            .Include(cp => cp.Campaign)
            .FirstOrDefaultAsync(cp => cp.TeamId == teamId && cp.Id == contentPostId);
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
            .Include(cp => cp.Publications)
            .Include(cp => cp.Campaign)
            .Where(cp => cp.TeamId == teamId && cp.Status != ContentStatus.Deleted);

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
            .Include(cp => cp.Publications)
            .Where(cp =>
                cp.TeamId == teamId &&
                cp.CampaignId == campaignId &&
                cp.Status != ContentStatus.Deleted)
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
            .Where(p => p.TeamId == teamId && p.Status == ContentStatus.Deleted)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Dictionary<int, CampaignPostSummaryDto>> GetPostSummariesByCampaignAsync(
        Guid teamId,
        IEnumerable<int> campaignIds)
    {
        var ids = campaignIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<int, CampaignPostSummaryDto>();

        var posts = await _context.ContentPosts
            .Where(p =>
                p.TeamId == teamId &&
                p.CampaignId.HasValue &&
                ids.Contains(p.CampaignId.Value) &&
                p.Status != ContentStatus.Deleted)
            .Select(p => new
            {
                CampaignId = p.CampaignId!.Value,
                p.Status,
                HasPublished = p.Publications.Any(pub => pub.Status == PublicationStatus.Published),
                HasActiveSchedule = p.Publications.Any(pub =>
                    pub.Status == PublicationStatus.Scheduled || pub.Status == PublicationStatus.Queued)
            })
            .ToListAsync();

        var result = ids.ToDictionary(
            id => id,
            id => new CampaignPostSummaryDto(0, 0, 0));

        foreach (var group in posts.GroupBy(p => p.CampaignId))
        {
            var draftCount = 0;
            var scheduledCount = 0;
            var publishedCount = 0;

            foreach (var post in group)
            {
                var effectiveStatus = post.Status;
                if (post.HasPublished)
                    effectiveStatus = ContentStatus.Published;
                else if (post.HasActiveSchedule)
                    effectiveStatus = ContentStatus.Scheduled;

                if (effectiveStatus is ContentStatus.Draft or ContentStatus.Ready)
                    draftCount++;
                else if (effectiveStatus == ContentStatus.Scheduled)
                    scheduledCount++;
                else if (effectiveStatus == ContentStatus.Published)
                    publishedCount++;
            }

            result[group.Key] = new CampaignPostSummaryDto(draftCount, scheduledCount, publishedCount);
        }

        return result;
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