using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IPostPublicationRepository
{
    Task AddAsync(PostPublication publication);
    Task<PostPublication?> GetByIdAsync(Guid teamId, int publicationId);
    Task<PostPublication?> GetByIdempotencyKeyAsync(Guid teamId, string idempotencyKey);
    Task<PostPublication?> GetActiveByIntentAsync(Guid teamId, int contentPostId, int socialAccountId, int? postVariantId, DateTime? scheduledAt);
    Task<List<PostPublication>> GetPublishedNeedingAnalyticsAsync(DateTime utcNow, int batchSize);
    Task<List<PostPublication>> GetPendingByContentPostAsync(Guid teamId, int contentPostId);
    Task SaveChangesAsync();
}
