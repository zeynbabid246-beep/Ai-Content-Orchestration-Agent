using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ISocialAccountRepository
{
    Task AddAsync(SocialAccount socialAccount);
    Task<SocialAccount?> GetByIdAsync(Guid teamId, int socialAccountId);
    Task<List<SocialAccount>> GetByTeamAsync(Guid teamId);
    Task<bool> ExistsAsync(Guid teamId, SocialPlatform platform, string normalizedHandle, int? excludeSocialAccountId = null);
    Task<SocialAccount?> GetByExternalAccountIdForTeamAsync(Guid teamId, SocialPlatform platform, string externalAccountId);
    Task DeactivateDuplicateAccountsForTeamAsync(Guid teamId, SocialPlatform platform, string externalAccountId, int keepSocialAccountId);
    Task<List<SocialAccount>> GetExpiringBeforeAsync(DateTime thresholdUtc);
    Task SaveChangesAsync();
}
