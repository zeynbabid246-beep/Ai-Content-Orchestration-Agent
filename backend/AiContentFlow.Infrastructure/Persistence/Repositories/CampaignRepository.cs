using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class CampaignRepository : ICampaignRepository
{
    private readonly AppDbContext _context;

    public CampaignRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Campaign campaign)
    {
        await _context.Campaigns.AddAsync(campaign);
    }

    public async Task<Campaign?> GetByIdAsync(Guid teamId, int campaignId)
    {
        return await _context.Campaigns
            .Include(c => c.ContentPosts)
            .FirstOrDefaultAsync(c => c.TeamId == teamId && c.Id == campaignId && !c.IsDeleted);
    }

    public async Task<List<Campaign>> GetByTeamAsync(Guid teamId)
    {
        return await _context.Campaigns
            .Include(c => c.ContentPosts)
            .Where(c => c.TeamId == teamId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(Guid teamId, string normalizedName, int? excludeCampaignId = null)
    {
        return await _context.Campaigns.AnyAsync(c =>
            c.TeamId == teamId
            && !c.IsDeleted
            && c.Name.ToLower() == normalizedName.ToLower()
            && (!excludeCampaignId.HasValue || c.Id != excludeCampaignId.Value));
    }

    public async Task SoftDeleteByChannelAsync(Guid teamId, int channelId, DateTime deletedAtUtc)
    {
        var campaigns = await _context.Campaigns
            .Where(c => c.TeamId == teamId && c.ChannelId == channelId && !c.IsDeleted)
            .ToListAsync();

        foreach (var campaign in campaigns)
        {
            campaign.IsDeleted = true;
            campaign.DeletedAt = deletedAtUtc;
            campaign.UpdatedAt = deletedAtUtc;
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
