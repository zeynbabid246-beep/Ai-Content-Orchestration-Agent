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
    int ChannelId,
    int SocialAccountId,
    string? Title,
    ContentType ContentType,
    string ContentJson,
    string? Prompt,
    string? AiModel,
    int? AiTokens,
    IReadOnlyList<CreatePostVariantDto>? PostVariants
);

public record UpdateContentPostDto(
    int ChannelId,
    int SocialAccountId,
    string? Title,
    ContentType ContentType,
    string ContentJson,
    ContentStatus Status,
    string? Prompt,
    string? AiModel,
    int? AiTokens,
    IReadOnlyList<UpdatePostVariantDto>? PostVariants
);

public record TransitionContentPostStatusDto(
    ContentStatus Status
);

public record ScheduleContentPostDto(
    DateTime ScheduledAt
);

public record PublishContentPostDto(
    string? PlatformPostId,
    string? PlatformPostUrl
);

public record PostVariantResponseDto(
    int Id,
    int ContentPostId,
    SocialPlatform Platform,
    string ContentJson,
    string? Title,
    ContentStatus Status,
    string? PlatformPostId,
    string? PlatformPostUrl,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    int RetryCount,
    string? LastError,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ContentPostResponseDto(
    int Id,
    Guid TeamId,
    int ChannelId,
    int SocialAccountId,
    string? Title,
    ContentType ContentType,
    string ContentJson,
    ContentStatus Status,
    string? Prompt,
    string? AiModel,
    int? AiTokens,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    string? PlatformPostId,
    string? PlatformPostUrl,
    int RetryCount,
    string? LastError,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<PostVariantResponseDto> PostVariants
);
