using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IChannelRepository
{
    Task AddAsync(Channel channel);
    Task<Channel?> GetByIdAsync(Guid teamId, int channelId);
    Task<List<Channel>> GetByTeamAsync(Guid teamId);
    Task<bool> ExistsByNameAsync(Guid teamId, string normalizedName, int? excludeChannelId = null);
    Task SaveChangesAsync();
}