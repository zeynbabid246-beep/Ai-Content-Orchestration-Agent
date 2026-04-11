using AiContentFlow.Application.Features.Campaigns.Dtos;

namespace AiContentFlow.Application.Features.Campaigns;

public interface ICampaignService
{
    Task<CampaignResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateCampaignDto dto);
    Task<List<CampaignResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId);
    Task<CampaignResponseDto> GetByIdAsync(Guid teamId, int campaignId, string requestingUserId);
    Task<CampaignResponseDto> UpdateAsync(Guid teamId, int campaignId, string requestingUserId, UpdateCampaignDto dto);
    Task DeleteAsync(Guid teamId, int campaignId, string requestingUserId);
    Task LinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId);
    Task UnlinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId);
}
