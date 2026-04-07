using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Posts.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Posts;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly ITeamRepository _teamRepository;

    public PostService(IPostRepository postRepository, ITeamRepository teamRepository)
    {
        _postRepository = postRepository;
        _teamRepository = teamRepository;
    }

    public async Task<PostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreatePostDto dto)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Owner && membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Owner/Admin can create posts");

        var post = new Post
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            Title = dto.Title.Trim(),
            Content = dto.Content.Trim(),
            CreatedByUserId = requestingUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        return Map(post);
    }

    public async Task<List<PostResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var posts = await _postRepository.GetByTeamAsync(teamId);
        return posts.Select(Map).ToList();
    }

    public async Task<PostResponseDto> GetByIdAsync(Guid teamId, Guid postId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var post = await _postRepository.GetByIdAsync(teamId, postId)
            ?? throw new KeyNotFoundException("Post not found");

        return Map(post);
    }

    public async Task<PostResponseDto> UpdateAsync(Guid teamId, Guid postId, string requestingUserId, UpdatePostDto dto)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        var post = await _postRepository.GetByIdAsync(teamId, postId)
            ?? throw new KeyNotFoundException("Post not found");

        var canManage = membership.Role == TeamRole.Owner || membership.Role == TeamRole.Admin || post.CreatedByUserId == requestingUserId;

        if (!canManage)
            throw new UnauthorizedAccessException("Not allowed to update this post");

        post.Title = dto.Title.Trim();
        post.Content = dto.Content.Trim();
        post.UpdatedAt = DateTime.UtcNow;

        await _postRepository.SaveChangesAsync();

        return Map(post);
    }

    public async Task DeleteAsync(Guid teamId, Guid postId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        var post = await _postRepository.GetByIdAsync(teamId, postId)
            ?? throw new KeyNotFoundException("Post not found");

        var canManage = membership.Role == TeamRole.Owner || membership.Role == TeamRole.Admin || post.CreatedByUserId == requestingUserId;

        if (!canManage)
            throw new UnauthorizedAccessException("Not allowed to delete this post");

        await _postRepository.RemoveAsync(post);
        await _postRepository.SaveChangesAsync();
    }

    private static PostResponseDto Map(Post post)
    {
        return new PostResponseDto(
            post.Id,
            post.TeamId,
            post.Title,
            post.Content,
            post.CreatedByUserId,
            post.CreatedAt,
            post.UpdatedAt
        );
    }
}
