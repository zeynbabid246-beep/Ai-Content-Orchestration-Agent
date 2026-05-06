using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IPublicationAnalyticsRepository
{
    Task AddAsync(PublicationAnalytics analytics);
    Task<bool> ExistsByDedupeKeyAsync(Guid teamId, string dedupeKey);
    Task<List<PublicationAnalytics>> GetByPublicationAsync(Guid teamId, int publicationId);
    Task SaveChangesAsync();
}
