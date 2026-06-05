using AiContentFlow.Application.Features.Channels.Dtos;

namespace AiContentFlow.Application.Features.Channels;

public interface IChannelSocialAccountService
{
    Task<ChannelSocialAccountsResponseDto> GetChannelSocialAccountsAsync(Guid teamId, int channelId, string requestingUserId);
    Task LinkAsync(Guid teamId, int channelId, string requestingUserId, LinkChannelSocialAccountDto dto);
    Task UnlinkAsync(Guid teamId, int channelId, int socialAccountId, string requestingUserId);
}
