using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IContentPostRepository
{
    Task AddAsync(ContentPost contentPost);
    Task<ContentPost?> GetByIdAsync(Guid teamId, int contentPostId);
    Task<List<ContentPost>> GetByTeamAsync(Guid teamId);
    Task SaveChangesAsync();
}
