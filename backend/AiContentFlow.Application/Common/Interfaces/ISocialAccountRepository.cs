using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ISocialAccountRepository
{
    Task AddAsync(SocialAccount socialAccount);
    Task<SocialAccount?> GetByIdAsync(Guid teamId, int socialAccountId);
    Task<List<SocialAccount>> GetByTeamAsync(Guid teamId);
    Task<bool> ExistsAsync(Guid teamId, int channelId, SocialPlatform platform, string normalizedHandle, int? excludeSocialAccountId = null);
    Task SaveChangesAsync();
}