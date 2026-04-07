using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.ContentPosts;

public class ContentPostService : IContentPostService
{
    private readonly IContentPostRepository _contentPostRepository;
    private readonly ITeamRepository _teamRepository;

    public ContentPostService(IContentPostRepository contentPostRepository, ITeamRepository teamRepository)
    {
        _contentPostRepository = contentPostRepository;
        _teamRepository = teamRepository;
    }

    public async Task<ContentPostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateContentPostDto dto)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Owner && membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Owner/Admin can create content posts");

        var contentPost = new ContentPost
        {
            TeamId = teamId,
            ChannelId = dto.ChannelId,
            SocialAccountId = dto.SocialAccountId,
            Title = Normalize(dto.Title),
            ContentType = dto.ContentType,
            ContentJson = dto.ContentJson.Trim(),
            Status = ContentStatus.Draft,
            Prompt = Normalize(dto.Prompt),
            AiModel = Normalize(dto.AiModel),
            AiTokens = dto.AiTokens,
            RetryCount = 0,
            CreatedByUserId = requestingUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PostVariants = MapVariants(dto.PostVariants)
        };

        await _contentPostRepository.AddAsync(contentPost);
        await _contentPostRepository.SaveChangesAsync();

        return Map(contentPost);
    }

    public async Task<List<ContentPostResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var contentPosts = await _contentPostRepository.GetByTeamAsync(teamId);
        return contentPosts.Select(Map).ToList();
    }

    public async Task<ContentPostResponseDto> GetByIdAsync(Guid teamId, int contentPostId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        return Map(contentPost);
    }

    public async Task<ContentPostResponseDto> UpdateAsync(Guid teamId, int contentPostId, string requestingUserId, UpdateContentPostDto dto)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        if (contentPost.Status == ContentStatus.Deleted)
            throw new KeyNotFoundException("Content post not found");

        var canManage = membership.Role == TeamRole.Owner || membership.Role == TeamRole.Admin || contentPost.CreatedByUserId == requestingUserId;

        if (!canManage)
            throw new UnauthorizedAccessException("Not allowed to update this content post");

        contentPost.ChannelId = dto.ChannelId;
        contentPost.SocialAccountId = dto.SocialAccountId;
        contentPost.Title = Normalize(dto.Title);
        contentPost.ContentType = dto.ContentType;
        contentPost.ContentJson = dto.ContentJson.Trim();
        contentPost.Status = dto.Status;
        contentPost.Prompt = Normalize(dto.Prompt);
        contentPost.AiModel = Normalize(dto.AiModel);
        contentPost.AiTokens = dto.AiTokens;
        contentPost.UpdatedAt = DateTime.UtcNow;

        if (dto.PostVariants is not null)
        {
            contentPost.PostVariants.Clear();
            foreach (var variant in MapVariants(dto.PostVariants))
            {
                contentPost.PostVariants.Add(variant);
            }
        }

        await _contentPostRepository.SaveChangesAsync();

        return Map(contentPost);
    }

    public async Task DeleteAsync(Guid teamId, int contentPostId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        var canManage = membership.Role == TeamRole.Owner || membership.Role == TeamRole.Admin || contentPost.CreatedByUserId == requestingUserId;

        if (!canManage)
            throw new UnauthorizedAccessException("Not allowed to delete this content post");

        contentPost.Status = ContentStatus.Deleted;
        contentPost.UpdatedAt = DateTime.UtcNow;

        await _contentPostRepository.SaveChangesAsync();
    }

    private static List<PostVariant> MapVariants(IReadOnlyList<CreatePostVariantDto>? variants)
    {
        if (variants is null || variants.Count == 0)
        {
            return [];
        }

        return variants.Select(variant => new PostVariant
        {
            Platform = variant.Platform,
            ContentJson = variant.ContentJson.Trim(),
            Title = Normalize(variant.Title),
            Status = ContentStatus.Draft,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();
    }

    private static List<PostVariant> MapVariants(IReadOnlyList<UpdatePostVariantDto>? variants)
    {
        if (variants is null || variants.Count == 0)
        {
            return [];
        }

        return variants.Select(variant => new PostVariant
        {
            Platform = variant.Platform,
            ContentJson = variant.ContentJson.Trim(),
            Title = Normalize(variant.Title),
            Status = ContentStatus.Draft,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();
    }

    private static ContentPostResponseDto Map(ContentPost contentPost)
    {
        return new ContentPostResponseDto(
            contentPost.Id,
            contentPost.TeamId,
            contentPost.ChannelId,
            contentPost.SocialAccountId,
            contentPost.Title,
            contentPost.ContentType,
            contentPost.ContentJson,
            contentPost.Status,
            contentPost.Prompt,
            contentPost.AiModel,
            contentPost.AiTokens,
            contentPost.ScheduledAt,
            contentPost.PublishedAt,
            contentPost.PlatformPostId,
            contentPost.PlatformPostUrl,
            contentPost.RetryCount,
            contentPost.LastError,
            contentPost.CreatedAt,
            contentPost.UpdatedAt,
            contentPost.PostVariants.Select(Map).ToList()
        );
    }

    private static PostVariantResponseDto Map(PostVariant variant)
    {
        return new PostVariantResponseDto(
            variant.Id,
            variant.ContentPostId,
            variant.Platform,
            variant.ContentJson,
            variant.Title,
            variant.Status,
            variant.PlatformPostId,
            variant.PlatformPostUrl,
            variant.ScheduledAt,
            variant.PublishedAt,
            variant.RetryCount,
            variant.LastError,
            variant.CreatedAt,
            variant.UpdatedAt
        );
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
