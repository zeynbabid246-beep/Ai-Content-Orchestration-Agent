using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IChannelSocialAccountRepository
{
    Task<List<ChannelSocialAccount>> GetLinksForChannelAsync(Guid teamId, int channelId);
    Task<List<int>> GetLinkedSocialAccountIdsAsync(Guid teamId, int channelId);
    Task<bool> IsLinkedAsync(Guid teamId, int channelId, int socialAccountId);
    Task<SocialAccount?> GetLinkedAccountForPlatformAsync(Guid teamId, int channelId, SocialPlatform platform);
    Task LinkAsync(ChannelSocialAccount link);
    Task UnlinkAsync(Guid teamId, int channelId, int socialAccountId);
    Task RemoveAllLinksForAccountAsync(int socialAccountId);
    Task RemoveAllLinksForChannelAsync(int channelId);
    Task UnlinkPlatformFromChannelAsync(Guid teamId, int channelId, SocialPlatform platform);
    Task<Dictionary<int, List<int>>> GetLinkedChannelIdsByAccountIdsAsync(Guid teamId, IEnumerable<int> accountIds);
    Task SaveChangesAsync();
}
