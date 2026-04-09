using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ICampaignRepository
{
    Task AddAsync(Campaign campaign);
    Task<Campaign?> GetByIdAsync(Guid teamId, int campaignId);
    Task<List<Campaign>> GetByTeamAsync(Guid teamId);
    Task<bool> ExistsByNameAsync(Guid teamId, string normalizedName, int? excludeCampaignId = null);
    Task SaveChangesAsync();
}
