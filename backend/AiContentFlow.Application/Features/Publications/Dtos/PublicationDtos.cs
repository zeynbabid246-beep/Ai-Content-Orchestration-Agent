using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Publications.Dtos;

public record SchedulePublicationDto(
    int SocialAccountId,
    int? PostVariantId,
    DateTime ScheduledAt,
    string? IdempotencyKey = null
);

public record PublishPublicationDto(
    int SocialAccountId,
    int? PostVariantId,
    string? IdempotencyKey = null
);

public record PublicationResponseDto(
    int Id,
    Guid TeamId,
    int ContentPostId,
    int? PostVariantId,
    int SocialAccountId,
    PublicationStatus Status,
    DateTime? ScheduledAt,
    DateTime? PublishedAt,
    string? ExternalPostId,
    string? ExternalPostUrl,
    string? ErrorMessage,
    string? IdempotencyKey,
    int RetryCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
