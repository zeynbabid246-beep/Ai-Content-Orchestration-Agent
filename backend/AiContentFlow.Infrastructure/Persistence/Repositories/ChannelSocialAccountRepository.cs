using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class ChannelSocialAccountRepository : IChannelSocialAccountRepository
{
    private readonly AppDbContext _context;

    public ChannelSocialAccountRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChannelSocialAccount>> GetLinksForChannelAsync(Guid teamId, int channelId)
    {
        return await _context.ChannelSocialAccounts
            .Include(x => x.SocialAccount)
            .Where(x => x.ChannelId == channelId && x.Channel!.TeamId == teamId && !x.Channel.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<int>> GetLinkedSocialAccountIdsAsync(Guid teamId, int channelId)
    {
        return await _context.ChannelSocialAccounts
            .Where(x => x.ChannelId == channelId && x.Channel!.TeamId == teamId && !x.Channel.IsDeleted)
            .Select(x => x.SocialAccountId)
            .ToListAsync();
    }

    public async Task<bool> IsLinkedAsync(Guid teamId, int channelId, int socialAccountId)
    {
        return await _context.ChannelSocialAccounts.AnyAsync(x =>
            x.ChannelId == channelId
            && x.SocialAccountId == socialAccountId
            && x.Channel!.TeamId == teamId
            && !x.Channel.IsDeleted);
    }

    public async Task<SocialAccount?> GetLinkedAccountForPlatformAsync(Guid teamId, int channelId, SocialPlatform platform)
    {
        return await _context.ChannelSocialAccounts
            .Where(x => x.ChannelId == channelId && x.Channel!.TeamId == teamId && !x.Channel.IsDeleted)
            .Select(x => x.SocialAccount)
            .FirstOrDefaultAsync(sa => sa != null && !sa.IsDeleted && sa.Platform == platform);
    }

    public async Task LinkAsync(ChannelSocialAccount link)
    {
        await _context.ChannelSocialAccounts.AddAsync(link);
    }

    public async Task UnlinkAsync(Guid teamId, int channelId, int socialAccountId)
    {
        var link = await _context.ChannelSocialAccounts
            .Include(x => x.Channel)
            .FirstOrDefaultAsync(x =>
                x.ChannelId == channelId
                && x.SocialAccountId == socialAccountId
                && x.Channel!.TeamId == teamId);

        if (link != null)
            _context.ChannelSocialAccounts.Remove(link);
    }

    public async Task RemoveAllLinksForAccountAsync(int socialAccountId)
    {
        var links = await _context.ChannelSocialAccounts
            .Where(x => x.SocialAccountId == socialAccountId)
            .ToListAsync();

        _context.ChannelSocialAccounts.RemoveRange(links);
    }

    public async Task RemoveAllLinksForChannelAsync(int channelId)
    {
        var links = await _context.ChannelSocialAccounts
            .Where(x => x.ChannelId == channelId)
            .ToListAsync();

        _context.ChannelSocialAccounts.RemoveRange(links);
    }

    public async Task UnlinkPlatformFromChannelAsync(Guid teamId, int channelId, SocialPlatform platform)
    {
        var links = await _context.ChannelSocialAccounts
            .Include(x => x.SocialAccount)
            .Where(x =>
                x.ChannelId == channelId
                && x.Channel!.TeamId == teamId
                && !x.Channel.IsDeleted
                && x.SocialAccount != null
                && x.SocialAccount.Platform == platform)
            .ToListAsync();

        _context.ChannelSocialAccounts.RemoveRange(links);
    }

    public async Task<Dictionary<int, List<int>>> GetLinkedChannelIdsByAccountIdsAsync(Guid teamId, IEnumerable<int> accountIds)
    {
        var ids = accountIds.Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<int, List<int>>();

        var rows = await _context.ChannelSocialAccounts
            .Where(x => ids.Contains(x.SocialAccountId) && x.Channel!.TeamId == teamId && !x.Channel.IsDeleted)
            .Select(x => new { x.SocialAccountId, x.ChannelId })
            .ToListAsync();

        return rows
            .GroupBy(x => x.SocialAccountId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.ChannelId).Distinct().ToList());
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
