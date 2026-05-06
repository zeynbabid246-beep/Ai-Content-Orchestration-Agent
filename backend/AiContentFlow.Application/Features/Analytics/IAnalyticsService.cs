using AiContentFlow.Application.Features.Analytics.Dtos;

namespace AiContentFlow.Application.Features.Analytics;

public interface IAnalyticsService
{
    Task<PublicationAnalyticsResponseDto?> RecordAsync(Guid teamId, string requestingUserId, RecordPublicationAnalyticsDto dto);
    Task<List<PublicationAnalyticsResponseDto>> GetByPublicationAsync(Guid teamId, int publicationId, string requestingUserId);
}
