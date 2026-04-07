using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IPostRepository
{
    Task AddAsync(Post post);
    Task<Post?> GetByIdAsync(Guid teamId, Guid postId);
    Task<List<Post>> GetByTeamAsync(Guid teamId);
    Task RemoveAsync(Post post);
    Task SaveChangesAsync();
}
