using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class SocialAccountRepository : ISocialAccountRepository
{
    private readonly AppDbContext _context;

    public SocialAccountRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(SocialAccount socialAccount)
    {
        await _context.SocialAccounts.AddAsync(socialAccount);
    }

    public async Task<SocialAccount?> GetByIdAsync(Guid teamId, int socialAccountId)
    {
        return await _context.SocialAccounts
            .FirstOrDefaultAsync(sa => sa.TeamId == teamId 
                                    && sa.Id == socialAccountId 
                                    && !sa.IsDeleted);
    }

    public async Task<List<SocialAccount>> GetByTeamAsync(Guid teamId)
    {
        return await _context.SocialAccounts
            .Where(sa => sa.TeamId == teamId && !sa.IsDeleted)
            .OrderByDescending(sa => sa.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(Guid teamId, int channelId, SocialPlatform platform, string normalizedHandle, int? excludeSocialAccountId = null)
    {
        return await _context.SocialAccounts.AnyAsync(sa =>
            sa.TeamId == teamId
            && sa.ChannelId == channelId
            && sa.Platform == platform
            && !sa.IsDeleted
            && sa.AccountHandle.ToLower() == normalizedHandle.ToLower()
            && (!excludeSocialAccountId.HasValue || sa.Id != excludeSocialAccountId.Value));
    }

    public async Task<SocialAccount?> GetByExternalAccountIdAsync(Guid teamId, int channelId, SocialPlatform platform, string externalAccountId)
    {
        return await _context.SocialAccounts.FirstOrDefaultAsync(sa =>
            sa.TeamId == teamId
            && sa.ChannelId == channelId
            && sa.Platform == platform
            && sa.ExternalAccountId == externalAccountId
            && !sa.IsDeleted);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}