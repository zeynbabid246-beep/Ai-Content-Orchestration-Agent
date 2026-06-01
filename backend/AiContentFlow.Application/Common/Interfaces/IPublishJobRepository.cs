using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IPublishJobRepository
{
    Task AddAsync(PublishJob job);
    Task<List<PublishJob>> ClaimDueAsync(DateTime utcNow, int batchSize, string workerId);
    Task<List<PublishJob>> GetByTeamAndStatusAsync(Guid teamId, PublishJobStatus status, int take = 50);
    Task SaveChangesAsync();
}
