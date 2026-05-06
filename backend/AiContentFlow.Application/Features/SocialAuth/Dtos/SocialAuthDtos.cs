namespace AiContentFlow.Application.Features.SocialAuth.Dtos;

public record SocialAuthLoginResultDto(
    Guid TeamId,
    int ChannelId,
    string Platform,
    string AuthorizationUrl);

public record SocialAuthCallbackResultDto(
    int ChannelId,
    Guid TeamId,
    IReadOnlyList<SocialAccountAuthResultDto> Accounts);

public record SocialAccountAuthResultDto(
    int Id,
    int ChannelId,
    string Platform,
    string ExternalAccountId,
    string AccountName,
    string AccountHandle,
    string? DisplayName,
    DateTime TokenExpiry);
