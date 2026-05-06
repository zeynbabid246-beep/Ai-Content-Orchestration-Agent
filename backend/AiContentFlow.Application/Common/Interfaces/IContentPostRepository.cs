using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IContentPostRepository
{
    Task AddAsync(ContentPost contentPost);
    Task<ContentPost?> GetByIdAsync(Guid teamId, int contentPostId);
    Task<List<ContentPost>> GetByTeamAsync(Guid teamId);
    Task<List<ContentPost>> GetByStatusAsync(Guid teamId, ContentStatus status); 
    Task<List<ContentPost>> GetScheduledAsync(Guid teamId);                      
    Task<List<ContentPost>> GetDeletedAsync(Guid teamId);                        
    Task<ContentPost> UpdateAsync(ContentPost post);
    Task SaveChangesAsync();
}