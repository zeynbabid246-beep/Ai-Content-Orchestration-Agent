namespace AiContentFlow.Application.Features.SocialAuth.Dtos;

public record SocialAuthLoginResultDto(
    Guid TeamId,
    int? LinkChannelId,
    string Platform,
    string AuthorizationUrl);

public record SocialAuthCallbackResultDto(
    int? LinkChannelId,
    Guid TeamId,
    string? RedirectPath,
    IReadOnlyList<SocialAccountAuthResultDto> Accounts);

public record SocialAccountAuthResultDto(
    int Id,
    string Platform,
    string ExternalAccountId,
    string AccountName,
    string AccountHandle,
    string? DisplayName,
    DateTime TokenExpiry);
