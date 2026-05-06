namespace AiContentFlow.Application.Common.Models;

public record SocialAuthState(
    Guid TeamId,
    int ChannelId,
    string UserId,
    string Platform,
    DateTime ExpiresAt);
