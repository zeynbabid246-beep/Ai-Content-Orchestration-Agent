using AiContentFlow.Application.Features.Posts.Dtos;

namespace AiContentFlow.Application.Features.Posts;

public interface IPostService
{
    Task<PostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreatePostDto dto);
    Task<List<PostResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId);
    Task<PostResponseDto> GetByIdAsync(Guid teamId, Guid postId, string requestingUserId);
    Task<PostResponseDto> UpdateAsync(Guid teamId, Guid postId, string requestingUserId, UpdatePostDto dto);
    Task DeleteAsync(Guid teamId, Guid postId, string requestingUserId);
}
