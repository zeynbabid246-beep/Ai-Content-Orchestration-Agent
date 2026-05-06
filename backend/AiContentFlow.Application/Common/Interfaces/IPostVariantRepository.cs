using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IPostVariantRepository
{
    Task<PostVariant?> GetByIdAsync(Guid teamId, int id);
    Task<List<PostVariant>> GetByContentPostIdAsync(Guid teamId, int contentPostId);
    Task AddAsync(PostVariant variant);
    Task UpdateAsync(PostVariant variant);
    Task SaveChangesAsync();
}