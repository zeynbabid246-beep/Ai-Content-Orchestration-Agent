using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ISocialCredentialStore
{
    Task StoreAsync(SocialAccount account, string accessToken, string? refreshToken, DateTime tokenExpiry);
    Task<string> GetAccessTokenAsync(SocialAccount account);
    Task<string?> GetRefreshTokenAsync(SocialAccount account);
}
