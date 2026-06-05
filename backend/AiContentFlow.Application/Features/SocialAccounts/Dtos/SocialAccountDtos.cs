using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.SocialAccounts.Dtos;

public record CreateSocialAccountDto(
    SocialPlatform Platform,
    string AccountHandle,
    string? DisplayName,
    string? ExternalAccountId
);

public record UpdateSocialAccountDto(
    SocialPlatform Platform,
    SocialAccountStatus Status,
    string AccountHandle,
    string? DisplayName,
    string? ExternalAccountId
);

public record SocialAccountResponseDto(
    int Id,
    Guid TeamId,
    SocialPlatform Platform,
    SocialAccountStatus Status,
    string AccountHandle,
    string? DisplayName,
    string? ExternalAccountId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<int> LinkedChannelIds
);
