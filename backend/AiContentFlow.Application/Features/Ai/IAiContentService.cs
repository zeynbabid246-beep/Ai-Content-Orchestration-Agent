using AiContentFlow.Application.Features.Ai.Dtos;

namespace AiContentFlow.Application.Features.Ai;

public interface IAiContentService
{
    Task<GeneratePostResponseDto> GeneratePostAsync(Guid teamId, string requestingUserId, GeneratePostRequestDto dto);
    Task<SuggestCampaignResponseDto> SuggestCampaignAsync(Guid teamId, string requestingUserId, SuggestCampaignRequestDto dto);
}
