using AiContentFlow.Application.Features.SocialAccounts.Dtos;

namespace AiContentFlow.Application.Features.Channels.Dtos;

public record LinkChannelSocialAccountDto(int SocialAccountId);

public record ChannelSocialAccountsResponseDto(
    IReadOnlyList<SocialAccountResponseDto> LinkedAccounts,
    IReadOnlyList<SocialAccountResponseDto> AvailableTeamAccounts
);
