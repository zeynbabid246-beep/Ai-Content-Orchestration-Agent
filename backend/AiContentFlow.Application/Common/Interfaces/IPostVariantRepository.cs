using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IPostVariantRepository
{
    Task<PostVariant?> GetByIdAsync(int id);
    Task<List<PostVariant>> GetByContentPostIdAsync(int contentPostId);
    Task AddAsync(PostVariant variant);
    Task UpdateAsync(PostVariant variant);
    Task SaveChangesAsync();
}