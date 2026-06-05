using AiContentFlow.Application.Features.Publications.Dtos;

namespace AiContentFlow.Application.Features.Publications;

public interface IPublicationService
{
    Task<PublicationResponseDto> ScheduleAsync(Guid teamId, int contentPostId, string requestingUserId, SchedulePublicationDto dto);
    Task<PublicationResponseDto> PublishAsync(Guid teamId, int contentPostId, string requestingUserId, PublishPublicationDto dto);
    Task<PublicationResponseDto> GetByIdAsync(Guid teamId, int publicationId, string requestingUserId);
}
