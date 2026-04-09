using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class CampaignContentPostRepository : ICampaignContentPostRepository
{
    private readonly AppDbContext _context;

    public CampaignContentPostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CampaignContentPost?> GetByIdsAsync(int campaignId, int contentPostId)
    {
        return await _context.CampaignContentPosts
            .FirstOrDefaultAsync(x => x.CampaignId == campaignId && x.ContentPostId == contentPostId);
    }

    public async Task AddAsync(CampaignContentPost campaignContentPost)
    {
        await _context.CampaignContentPosts.AddAsync(campaignContentPost);
    }

    public Task RemoveAsync(CampaignContentPost campaignContentPost)
    {
        _context.CampaignContentPosts.Remove(campaignContentPost);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
