using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.SocialAccounts.Dtos;

public record CreateSocialAccountDto(
    int ChannelId,
    SocialPlatform Platform,
    string AccountHandle,
    string? DisplayName
);

public record UpdateSocialAccountDto(
    int ChannelId,
    SocialPlatform Platform,
    SocialAccountStatus Status,
    string AccountHandle,
    string? DisplayName
);

public record SocialAccountResponseDto(
    int Id,
    Guid TeamId,
    int ChannelId,
    SocialPlatform Platform,
    SocialAccountStatus Status,
    string AccountHandle,
    string? DisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);