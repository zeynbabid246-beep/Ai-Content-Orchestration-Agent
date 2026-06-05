using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.ContentPosts.Dtos;

public record CreatePostVariantDto(
    SocialPlatform Platform,
    string ContentJson,
    string? Title
);

public record UpdatePostVariantDto(
    SocialPlatform Platform,
    string ContentJson,
    string? Title
);

public record CreateContentPostDto(
    int? ChannelId,
    int? CampaignId,
    string? Title,
    ContentType ContentType,
    string ContentJson,
    string? Prompt,
    string? AiModel,
    int? AiTokens,
    IReadOnlyList<CreatePostVariantDto>? PostVariants,
    string? ImageUrl = null
);

public record UpdateContentPostDto(
    int? ChannelId,
    int? CampaignId,
    string? Title,
    ContentType ContentType,
    string ContentJson,
    ContentStatus Status,
    string? Prompt,
    string? AiModel,
    int? AiTokens,
    IReadOnlyList<UpdatePostVariantDto>? PostVariants,
    string? ImageUrl = null
);

public record TransitionContentPostStatusDto(
    ContentStatus Status
);

public record ScheduleContentPostDto(
    int SocialAccountId,
    int? PostVariantId,
    DateTime ScheduledAt,
    string? IdempotencyKey = null
);

public record PublishContentPostDto(
    int SocialAccountId,
    int? PostVariantId,
    string? IdempotencyKey = null
);


public record PostVariantResponseDto(
    int Id,
    int ContentPostId,
    SocialPlatform Platform,
    string ContentJson,
    string? Title,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ContentPostResponseDto(
    int Id,
    Guid TeamId,
    int? ChannelId,
    int? CampaignId,
    string? Title,
    ContentType ContentType,
    string ContentJson,
    ContentStatus Status,
    string? Prompt,
    string? AiModel,
    int? AiTokens,
    string? ImageUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<PostVariantResponseDto> PostVariants
);
