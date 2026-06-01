using AiContentFlow.Domain.Campaigns.Dtos;

namespace AiContentFlow.Domain.Campaigns.Interfaces;

public interface ICampaignService
{
    Task<CampaignResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateCampaignDto dto);
    Task<List<CampaignResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId);
    Task<CampaignResponseDto> GetByIdAsync(Guid teamId, int campaignId, string requestingUserId);
    Task<CampaignResponseDto> UpdateAsync(Guid teamId, int campaignId, string requestingUserId, UpdateCampaignDto dto);
    Task DeleteAsync(Guid teamId, int campaignId, string requestingUserId);
    Task LinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId);
    Task UnlinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId);
    Task<BulkCreateCampaignPostsResponseDto> BulkCreatePostsAsync(
        Guid teamId,
        int campaignId,
        string requestingUserId,
        BulkCreateCampaignPostsDto dto);
}
