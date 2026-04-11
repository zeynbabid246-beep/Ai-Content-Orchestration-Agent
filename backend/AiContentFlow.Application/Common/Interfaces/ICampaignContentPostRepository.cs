using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ICampaignContentPostRepository
{
    Task<CampaignContentPost?> GetByIdsAsync(int campaignId, int contentPostId);
    Task AddAsync(CampaignContentPost campaignContentPost);
    Task RemoveAsync(CampaignContentPost campaignContentPost);
    Task SaveChangesAsync();
}
