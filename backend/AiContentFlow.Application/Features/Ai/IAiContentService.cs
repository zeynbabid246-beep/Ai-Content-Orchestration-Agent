using AiContentFlow.Application.Features.Ai.Dtos;

namespace AiContentFlow.Application.Features.Ai;

public interface IAiContentService
{
    Task<GeneratePostResponseDto> GeneratePostAsync(Guid teamId, string requestingUserId, GeneratePostRequestDto dto);
    Task<SuggestCampaignResponseDto> SuggestCampaignAsync(Guid teamId, string requestingUserId, SuggestCampaignRequestDto dto);
    Task<CampaignStrategyStepResponseDto> GenerateCampaignStrategyStepAsync(
        Guid teamId,
        string requestingUserId,
        CampaignAiPipelineConfigDto dto);
    Task<CampaignPlanningStepResponseDto> GenerateCampaignPlanningStepAsync(
        Guid teamId,
        string requestingUserId,
        CampaignPlanningStepRequestDto dto);
    Task<CampaignContentStepResponseDto> GenerateCampaignContentStepAsync(
        Guid teamId,
        string requestingUserId,
        CampaignContentStepRequestDto dto);
    Task<MaterializeCampaignResponseDto> MaterializeCampaignAsync(
        Guid teamId,
        string requestingUserId,
        MaterializeCampaignRequestDto dto);
    Task SyncBrandToAiAsync(Guid teamId, string requestingUserId);
    Task<AiHealthResponseDto> GetAiHealthAsync();
    Task<AssistantChatResponseDto> ChatWithAssistantAsync(
        Guid teamId,
        string requestingUserId,
        AssistantChatRequestDto dto);
}
