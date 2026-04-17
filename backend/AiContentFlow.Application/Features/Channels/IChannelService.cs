using AiContentFlow.Application.Features.Channels.Dtos;

namespace AiContentFlow.Application.Features.Channels;

public interface IChannelService
{
    Task<ChannelResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateChannelDto dto);
    Task<List<ChannelResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId);
    Task<ChannelResponseDto> GetByIdAsync(Guid teamId, int channelId, string requestingUserId);
    Task<ChannelResponseDto> UpdateAsync(Guid teamId, int channelId, string requestingUserId, UpdateChannelDto dto);
    Task DeleteAsync(Guid teamId, int channelId, string requestingUserId);
}