namespace AiContentFlow.Application.Common.Models;

public record SocialAuthState(
    Guid TeamId,
    int? LinkChannelId,
    string UserId,
    string Platform,
    DateTime ExpiresAt);
