namespace AiContentFlow.Application.Common.Models;

public record SocialAuthResult(
    IReadOnlyList<SocialAccountAuthDto> Accounts);

public record SocialAccountAuthDto(
    string Platform,
    string ExternalAccountId,
    string AccountName,
    string AccountHandle,
    string? DisplayName,
    string AccessToken,
    DateTime TokenExpiry,
    string? RefreshToken);
