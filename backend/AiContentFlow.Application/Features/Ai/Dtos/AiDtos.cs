using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Ai.Dtos;

public record GeneratePostRequestDto(
    string Prompt,
    string? Model,
    int? ChannelId,
    int? CampaignId,
    bool UseBrandContext = true,
    SocialPlatform? Platform = null,
    string? Format = null);

public record GeneratePostResponseDto(
    string ContentJson,
    string? ModelUsed,
    string? CorrelationId = null);

public record SuggestCampaignRequestDto(
    int ChannelId,
    string Goal,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<SocialPlatform> Platforms);

public record CampaignStepStatusDto(
    string Step,
    string Status,
    int? Id,
    string? Summary,
    string? Error);

public record SuggestedCampaignPostDto(
    string Title,
    string ContentJson,
    ContentType ContentType,
    DateTime ScheduledAt,
    SocialPlatform Platform);

public record SuggestCampaignResponseDto(
    string CampaignName,
    string Description,
    IReadOnlyList<SuggestedCampaignPostDto> Posts,
    CampaignStepStatusDto Strategy,
    CampaignStepStatusDto Planning,
    CampaignStepStatusDto Campaign,
    IReadOnlyList<string> Errors,
    string CorrelationId);
