using AiContentFlow.Application.Features.ContentPosts.Dtos;

namespace AiContentFlow.Application.Features.ContentPosts;

public interface IContentPostService
{
    Task<ContentPostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateContentPostDto dto);
    Task<List<ContentPostResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId);
    Task<ContentPostResponseDto> GetByIdAsync(Guid teamId, int contentPostId, string requestingUserId);
    Task<ContentPostResponseDto> UpdateAsync(Guid teamId, int contentPostId, string requestingUserId, UpdateContentPostDto dto);
    Task DeleteAsync(Guid teamId, int contentPostId, string requestingUserId);
}
