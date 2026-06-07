using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class ChannelRepository : IChannelRepository
{
    private readonly AppDbContext _context;

    public ChannelRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Channel channel)
    {
        await _context.Channels.AddAsync(channel);
    }

    public async Task<Channel?> GetByIdAsync(Guid teamId, int channelId)
    {
        return await _context.Channels
            .Include(c => c.Branding)
            .Include(c => c.Config)
            .FirstOrDefaultAsync(c => c.TeamId == teamId && c.Id == channelId && !c.IsDeleted);
    }

    public async Task<List<Channel>> GetByTeamAsync(Guid teamId)
    {
        return await _context.Channels
            .Include(c => c.Branding)
            .Include(c => c.Config)
            .Where(c => c.TeamId == teamId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> ExistsByNameAsync(Guid teamId, string normalizedName, int? excludeChannelId = null)
    {
        return await _context.Channels.AnyAsync(c =>
            c.TeamId == teamId
            && !c.IsDeleted
            && c.NormalizedName == normalizedName
            && (!excludeChannelId.HasValue || c.Id != excludeChannelId.Value));
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}