using AiContentFlow.Application.Features.ContentPosts.Dtos;

namespace AiContentFlow.Application.Features.ContentPosts;

public interface IContentPostService
{
    Task<ContentPostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateContentPostDto dto);
    Task<List<ContentPostResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId, ContentPostQueryDto? query = null);
    Task<ContentPostResponseDto> GetByIdAsync(Guid teamId, int contentPostId, string requestingUserId);
    Task<ContentPostResponseDto> UpdateAsync(Guid teamId, int contentPostId, string requestingUserId, UpdateContentPostDto dto);
    Task<ContentPostResponseDto> TransitionStatusAsync(Guid teamId, int contentPostId, string requestingUserId, TransitionContentPostStatusDto dto);
    Task<ContentPostResponseDto> MarkReadyAsync(Guid teamId, int contentPostId, string requestingUserId);
    Task<ContentPostResponseDto> RestoreAsync(Guid teamId, int contentPostId, string requestingUserId);
    Task<ContentPostResponseDto> CancelScheduleAsync(Guid teamId, int contentPostId, string requestingUserId);
    Task<ContentPostResponseDto> ScheduleAsync(Guid teamId, int contentPostId, string requestingUserId, ScheduleContentPostDto dto);
    Task<ContentPostResponseDto> PublishAsync(Guid teamId, int contentPostId, string requestingUserId, PublishContentPostDto dto);
    Task DeleteAsync(Guid teamId, int contentPostId, string requestingUserId);
}
