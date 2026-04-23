using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.ContentPosts;

public class ContentPostService : IContentPostService
{
    private readonly IContentPostRepository _contentPostRepository;
    private readonly IChannelRepository _channelRepository;
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly ITeamRepository _teamRepository;

    public ContentPostService(
        IContentPostRepository contentPostRepository,
        IChannelRepository channelRepository,
        ISocialAccountRepository socialAccountRepository,
        ITeamRepository teamRepository)
    {
        _contentPostRepository = contentPostRepository;
        _channelRepository = channelRepository;
        _socialAccountRepository = socialAccountRepository;
        _teamRepository = teamRepository;
    }

    public async Task<ContentPostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateContentPostDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can create content posts");

        await ValidateChannelAndSocialAccountAsync(teamId, dto.ChannelId, dto.SocialAccountId);

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
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can update content posts");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        if (contentPost.Status == ContentStatus.Deleted)
            throw new KeyNotFoundException("Content post not found");

        await ValidateChannelAndSocialAccountAsync(teamId, dto.ChannelId, dto.SocialAccountId);

        contentPost.ChannelId = dto.ChannelId;
        contentPost.SocialAccountId = dto.SocialAccountId;
        contentPost.Title = Normalize(dto.Title);
        contentPost.ContentType = dto.ContentType;
        contentPost.ContentJson = dto.ContentJson.Trim();
        if (dto.Status != contentPost.Status)
        {
            if (dto.Status == ContentStatus.Deleted)
                throw new InvalidOperationException("Use delete endpoint to delete content posts");

            if (dto.Status == ContentStatus.Scheduled)
                throw new InvalidOperationException("Use schedule endpoint to move content post to Scheduled");

            if (dto.Status == ContentStatus.Published)
                throw new InvalidOperationException("Use publish endpoint to move content post to Published");

        if (dto.Status != contentPost.Status)
            ApplyLifecycleTransition(contentPost, dto.Status);
        }
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

    public async Task<ContentPostResponseDto> TransitionStatusAsync(Guid teamId, int contentPostId, string requestingUserId, TransitionContentPostStatusDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can transition content posts");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        if (dto.Status == ContentStatus.Scheduled)
            throw new InvalidOperationException("Use schedule endpoint to move content post to Scheduled");

        if (dto.Status == ContentStatus.Published)
            throw new InvalidOperationException("Use publish endpoint to move content post to Published");

        if (dto.Status == ContentStatus.Deleted)
            throw new InvalidOperationException("Use delete endpoint to delete content posts");

        if (dto.Status != contentPost.Status)
            ApplyLifecycleTransition(contentPost, dto.Status);

        contentPost.UpdatedAt = DateTime.UtcNow;
        await _contentPostRepository.SaveChangesAsync();

        return Map(contentPost);
    }

    public async Task<ContentPostResponseDto> ScheduleAsync(Guid teamId, int contentPostId, string requestingUserId, ScheduleContentPostDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can schedule content posts");

        if (dto.ScheduledAt.Kind != DateTimeKind.Utc)
            throw new InvalidOperationException("ScheduledAt must be in UTC");

        if (dto.ScheduledAt <= DateTime.UtcNow)
            throw new InvalidOperationException("ScheduledAt must be in the future");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        ApplyLifecycleTransition(contentPost, ContentStatus.Scheduled);
        contentPost.ScheduledAt = dto.ScheduledAt;
        contentPost.UpdatedAt = DateTime.UtcNow;

        await _contentPostRepository.SaveChangesAsync();

        return Map(contentPost);
    }

    public async Task<ContentPostResponseDto> PublishAsync(Guid teamId, int contentPostId, string requestingUserId, PublishContentPostDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can publish content posts");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        ApplyLifecycleTransition(contentPost, ContentStatus.Published);
        contentPost.PublishedAt = DateTime.UtcNow;
        contentPost.PlatformPostId = Normalize(dto.PlatformPostId);
        contentPost.PlatformPostUrl = Normalize(dto.PlatformPostUrl);
        contentPost.UpdatedAt = DateTime.UtcNow;

        await _contentPostRepository.SaveChangesAsync();

        return Map(contentPost);
    }

    public async Task DeleteAsync(Guid teamId, int contentPostId, string requestingUserId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can delete content posts");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

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

    private static void ApplyLifecycleTransition(ContentPost contentPost, ContentStatus targetStatus)
    {
        EnsureValidLifecycleTransition(contentPost.Status, targetStatus);

        contentPost.Status = targetStatus;

        if (targetStatus == ContentStatus.Ready)
        {
            contentPost.ScheduledAt = null;
            contentPost.PublishedAt = null;
            contentPost.PlatformPostId = null;
            contentPost.PlatformPostUrl = null;
            return;
        }

        if (targetStatus == ContentStatus.Scheduled)
        {
            contentPost.PublishedAt = null;
            contentPost.PlatformPostId = null;
            contentPost.PlatformPostUrl = null;
        }
    }

    private static void EnsureValidLifecycleTransition(ContentStatus currentStatus, ContentStatus targetStatus)
    {
        if (currentStatus == ContentStatus.Deleted)
            throw new InvalidOperationException("Deleted content posts cannot be transitioned");

        if (targetStatus == ContentStatus.Deleted)
            throw new InvalidOperationException("Deleted status can only be set through delete operation");

        if (currentStatus == targetStatus)
            return;

        var isValidTransition =
            (currentStatus == ContentStatus.Draft && targetStatus == ContentStatus.Ready) ||
            (currentStatus == ContentStatus.Ready && targetStatus == ContentStatus.Scheduled) ||
            (currentStatus == ContentStatus.Scheduled && targetStatus == ContentStatus.Published);

        if (!isValidTransition)
            throw new InvalidOperationException($"Invalid content post status transition: {currentStatus} -> {targetStatus}");
    }

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId, string permissionErrorMessage)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException(permissionErrorMessage);
    }

    private async Task ValidateChannelAndSocialAccountAsync(Guid teamId, int? channelId, int? socialAccountId)
    {
        if (socialAccountId.HasValue && !channelId.HasValue)
            throw new InvalidOperationException("ChannelId is required when SocialAccountId is provided");

        if (channelId.HasValue)
        {
            _ = await _channelRepository.GetByIdAsync(teamId, channelId.Value)
                ?? throw new KeyNotFoundException("Channel not found");
        }

        if (!socialAccountId.HasValue)
        {
            return;
        }

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId.Value)
            ?? throw new KeyNotFoundException("Social account not found");

        if (channelId.HasValue && socialAccount.ChannelId != channelId.Value)
            throw new InvalidOperationException("Social account does not belong to the specified channel");
    }
}
