using System.Text.Json;
using AiContentFlow.Application.Features.Ai;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Ai.Dtos;

public record GeneratePostRequestDto(
    string Prompt,
    string? Model,
    int? ChannelId,
    int? CampaignId,
    bool UseBrandContext = true,
    SocialPlatform? Platform = null,
    string? Format = null,
    bool IncludeHashtags = false,
    bool IncludeCta = true,
    bool IncludeEmojis = false,
    QuickGeneratePostType PostType = QuickGeneratePostType.TextOnly,
    string? Language = null,
    bool GenerateVisuals = true);

public record GeneratePostResponseDto(
    string ContentJson,
    string? ModelUsed,
    string? CorrelationId = null);

public record SuggestCampaignRequestDto(
    int ChannelId,
    string Goal,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<SocialPlatform> Platforms,
    string? OrgId = null,
    string? Theme = null,
    string Language = "English",
    int? PostsPerWeek = null,
    string? CustomPrompt = null,
    string? PrimaryPlatform = null);

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

public record MaterializeCampaignPostInputDto(
    string Title,
    string ContentJson,
    ContentType ContentType,
    DateTime ScheduledAt,
    SocialPlatform Platform);

public record MaterializeCampaignRequestDto(
    int ChannelId,
    string Goal,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<SocialPlatform> Platforms,
    string? OrgId = null,
    string? Theme = null,
    string Language = "English",
    int? PostsPerWeek = null,
    string? CustomPrompt = null,
    string? PrimaryPlatform = null,
    bool RunSuggest = false,
    string? CampaignName = null,
    string? Description = null,
    IReadOnlyList<MaterializeCampaignPostInputDto>? Posts = null,
    int? ExistingCampaignId = null,
    bool SchedulePosts = false,
    IReadOnlyDictionary<string, int>? SocialAccountIdByPlatform = null);

public record MaterializeCampaignResponseDto(
    int CampaignId,
    IReadOnlyList<int> ContentPostIds,
    string CorrelationId,
    CampaignStepStatusDto Strategy,
    CampaignStepStatusDto Planning,
    CampaignStepStatusDto Campaign,
    IReadOnlyList<string> Errors);

public record AiHealthResponseDto(bool Healthy, string ProviderMode);

/// <summary>Shared pipeline config; org_id is always resolved server-side from Brand Studio.</summary>
public record CampaignAiPipelineConfigDto(
    int ChannelId,
    string Goal,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<SocialPlatform> Platforms,
    string Theme,
    string Language = "English",
    int PostsPerWeek = 4,
    string? CustomPrompt = null,
    string? PrimaryPlatform = null);

public record CampaignStrategyStepResponseDto(
    int? StrategyId,
    JsonElement Strategy,
    string OrgId,
    string CorrelationId);

public record CampaignPlanningStepRequestDto(
    CampaignAiPipelineConfigDto Config,
    int StrategyId,
    JsonElement Strategy,
    string? SelectedContentDirection = null,
    string DirectionMode = "single");

public record CampaignPlanningStepResponseDto(
    int? PlanningId,
    JsonElement Planning,
    string CorrelationId);

public record CampaignContentStepRequestDto(
    CampaignAiPipelineConfigDto Config,
    int StrategyId,
    JsonElement Strategy,
    int PlanningId,
    JsonElement Planning);

public record CampaignContentStepResponseDto(
    int? CampaignId,
    JsonElement Campaign,
    IReadOnlyList<SuggestedCampaignPostDto> Posts,
    string CampaignName,
    string Description,
    string CorrelationId);

public record AssistantChatRequestDto(
    string Message,
    string? Language = null,
    Dictionary<string, JsonElement>? Context = null);

public record AssistantScreenshotDto(
    string Title,
    string Url,
    string? Description = null);

public record AssistantChatResponseDto(
    string Answer,
    string Intent,
    string? BrandId,
    string? TargetAgent,
    bool NeedsBrandSelection,
    IReadOnlyList<string> SuggestedActions,
    string? Language,
    IReadOnlyList<AssistantScreenshotDto> Screenshots,
    Dictionary<string, JsonElement> Metadata,
    string? CorrelationId = null);

public record GeneratePostCreativeRequestDto(
    int ContentPostId,
    SocialPlatform? Platform = null,
    string Language = "English",
    string? VisualDirection = null,
    bool PersistToPost = true);

public record GeneratePostCreativeResponseDto(
    int? ContentPostId,
    string CreativeMode,
    string? PosterUrl,
    IReadOnlyList<string> CarouselAssets,
    string? CreativeError,
    string ContentJson,
    string CorrelationId);

public record GenerateCreativePreviewRequestDto(
    string ContentJson,
    SocialPlatform Platform,
    string Language = "English",
    string? VisualDirection = null);

public record GenerateCreativePreviewResponseDto(
    string CreativeMode,
    string? PosterUrl,
    IReadOnlyList<string> CarouselAssets,
    string? CreativeError,
    string ContentJson,
    string CorrelationId);
