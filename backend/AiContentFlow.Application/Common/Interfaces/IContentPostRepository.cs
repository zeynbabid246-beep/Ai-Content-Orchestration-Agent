using AiContentFlow.Domain.Campaigns.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IContentPostRepository
{
    Task AddAsync(ContentPost contentPost);
    Task<ContentPost?> GetByIdAsync(Guid teamId, int contentPostId);
    Task<ContentPost?> GetByIdIncludingDeletedAsync(Guid teamId, int contentPostId);
    Task<List<ContentPost>> GetByTeamAsync(Guid teamId);
    Task<List<ContentPost>> GetByTeamAsync(Guid teamId, int? channelId, int? campaignId, ContentStatus? status);
    Task<List<ContentPost>> GetByCampaignAsync(Guid teamId, int campaignId);
    Task<List<ContentPost>> GetByStatusAsync(Guid teamId, ContentStatus status); 
    Task<List<ContentPost>> GetScheduledAsync(Guid teamId);                      
    Task<List<ContentPost>> GetDeletedAsync(Guid teamId);
    Task<Dictionary<int, CampaignPostSummaryDto>> GetPostSummariesByCampaignAsync(Guid teamId, IEnumerable<int> campaignIds);
    Task<ContentPost> UpdateAsync(ContentPost post);
    Task SaveChangesAsync();
}