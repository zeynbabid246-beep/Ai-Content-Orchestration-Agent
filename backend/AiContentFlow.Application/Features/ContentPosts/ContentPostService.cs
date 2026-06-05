using AiContentFlow.Application.Common;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Services;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.ContentPosts;

public class ContentPostService : IContentPostService
{
    private const string DefaultChannelName = "General";
    private readonly IContentPostRepository _contentPostRepository;
    private readonly IChannelRepository _channelRepository;
    private readonly ICampaignRepository _campaignRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IPostVariantRepository _postVariantRepository;
    private readonly Features.Publications.IPublicationService _publicationService;
    private readonly ITeamActivityService _activityService;
    private readonly IValidator<CreateContentPostDto> _createValidator;
    private readonly IValidator<UpdateContentPostDto> _updateValidator;

    public ContentPostService(
        IContentPostRepository contentPostRepository,
        IChannelRepository channelRepository,
        ICampaignRepository campaignRepository,
        ITeamRepository teamRepository,
        IPostVariantRepository postVariantRepository,
        Features.Publications.IPublicationService publicationService,
        ITeamActivityService activityService,
        IValidator<CreateContentPostDto> createValidator,
        IValidator<UpdateContentPostDto> updateValidator)
    {
        _contentPostRepository = contentPostRepository;
        _channelRepository = channelRepository;
        _campaignRepository = campaignRepository;
        _teamRepository = teamRepository;
        _postVariantRepository = postVariantRepository;
        _publicationService = publicationService;
        _activityService = activityService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<ContentPostResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateContentPostDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can create content posts");

        var channelId = await ResolveChannelIdForCreateAsync(teamId, dto.ChannelId, dto.CampaignId);
        await ValidateCampaignAsync(teamId, channelId, dto.CampaignId);

        var contentPost = new ContentPost
        {
            TeamId = teamId,
            ChannelId = channelId,
            CampaignId = dto.CampaignId,
            Title = Normalize(dto.Title),
            ImageUrl = Normalize(dto.ImageUrl),
            ContentType = dto.ContentType,
            ContentJson = JsonContentValidator.Normalize(dto.ContentJson),
            Status = ContentStatus.Draft,
            Prompt = Normalize(dto.Prompt),
            AiModel = Normalize(dto.AiModel),
            AiTokens = dto.AiTokens,
            CreatedByUserId = requestingUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PostVariants = MapVariants(dto.PostVariants)
        };

        await _contentPostRepository.AddAsync(contentPost);
        await _contentPostRepository.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.PostCreated,
            "ContentPost",
            contentPost.Id.ToString());

        return Map(contentPost);
    }

    public async Task<List<ContentPostResponseDto>> GetByTeamAsync(
        Guid teamId,
        string requestingUserId,
        ContentPostQueryDto? query = null)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var contentPosts = query == null
            ? await _contentPostRepository.GetByTeamAsync(teamId)
            : await _contentPostRepository.GetByTeamAsync(
                teamId,
                query.ChannelId,
                query.CampaignId,
                query.Status);

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
        await _updateValidator.ValidateAndThrowAsync(dto);
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can update content posts");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        if (contentPost.Status == ContentStatus.Archived)
            throw new KeyNotFoundException("Content post not found");

        var channelId = await ResolveChannelIdAsync(teamId, dto.ChannelId, contentPost.ChannelId);
        await ValidateCampaignAsync(teamId, channelId, dto.CampaignId);

        contentPost.ChannelId = channelId;
        contentPost.CampaignId = dto.CampaignId;
        contentPost.Title = Normalize(dto.Title);
        contentPost.ImageUrl = Normalize(dto.ImageUrl);
        contentPost.ContentType = dto.ContentType;
        contentPost.ContentJson = JsonContentValidator.Normalize(dto.ContentJson);
        if (dto.Status != contentPost.Status)
        {
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

        await _publicationService.ScheduleAsync(
            teamId,
            contentPost.Id,
            requestingUserId,
            new Features.Publications.Dtos.SchedulePublicationDto(
                dto.SocialAccountId,
                dto.PostVariantId,
                dto.ScheduledAt,
                dto.IdempotencyKey));

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.PostScheduled,
            "ContentPost",
            contentPost.Id.ToString());

        return Map(contentPost);
    }

    public async Task<ContentPostResponseDto> PublishAsync(Guid teamId, int contentPostId, string requestingUserId, PublishContentPostDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can publish content posts");

        _ = await _publicationService.PublishAsync(
            teamId,
            contentPostId,
            requestingUserId,
            new Features.Publications.Dtos.PublishPublicationDto(
                dto.SocialAccountId,
                dto.PostVariantId,
                dto.IdempotencyKey));
        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.PostPublished,
            "ContentPost",
            contentPost.Id.ToString());

        return Map(contentPost);
    }

    public async Task DeleteAsync(Guid teamId, int contentPostId, string requestingUserId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId, "Only Admin or Editor can delete content posts");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        contentPost.Status = ContentStatus.Archived;
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
            ContentJson = JsonContentValidator.Normalize(variant.ContentJson),
            Title = Normalize(variant.Title),
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
            ContentJson = JsonContentValidator.Normalize(variant.ContentJson),
            Title = Normalize(variant.Title),
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
            contentPost.CampaignId,
            contentPost.Title,
            contentPost.ContentType,
            contentPost.ContentJson,
            contentPost.Status,
            contentPost.Prompt,
            contentPost.AiModel,
            contentPost.AiTokens,
            contentPost.ImageUrl,
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

    }

    private static void EnsureValidLifecycleTransition(ContentStatus currentStatus, ContentStatus targetStatus)
    {
        if (currentStatus == ContentStatus.Archived)
            throw new InvalidOperationException("Archived content posts cannot be transitioned");

        if (currentStatus == targetStatus)
            return;

        var isValidTransition =
            (currentStatus == ContentStatus.Draft && targetStatus == ContentStatus.Review) ||
            (currentStatus == ContentStatus.Review && targetStatus == ContentStatus.Approved) ||
            (currentStatus == ContentStatus.Approved && targetStatus == ContentStatus.Scheduled) ||
            (currentStatus == ContentStatus.Scheduled && targetStatus == ContentStatus.Published) ||
            (currentStatus == ContentStatus.Published && targetStatus == ContentStatus.Archived);

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

    private async Task ValidateCampaignAsync(Guid teamId, int? channelId, int? campaignId)
    {
        if (!campaignId.HasValue)
            return;

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId.Value)
            ?? throw new KeyNotFoundException("Campaign not found");

        if (!channelId.HasValue || campaign.ChannelId != channelId.Value)
            throw new InvalidOperationException("Campaign must belong to the same channel as the content post.");
    }

    private async Task<int?> ResolveChannelIdForCreateAsync(Guid teamId, int? requestedChannelId, int? campaignId)
    {
        if (campaignId.HasValue)
        {
            var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId.Value)
                ?? throw new KeyNotFoundException("Campaign not found");
            return campaign.ChannelId;
        }

        if (requestedChannelId.HasValue)
        {
            _ = await _channelRepository.GetByIdAsync(teamId, requestedChannelId.Value)
                ?? throw new KeyNotFoundException("Channel not found");
            return requestedChannelId.Value;
        }

        return null;
    }

    private async Task<int?> ResolveChannelIdAsync(Guid teamId, int? requestedChannelId, int? fallbackChannelId = null)
    {
        if (requestedChannelId.HasValue)
        {
            _ = await _channelRepository.GetByIdAsync(teamId, requestedChannelId.Value)
                ?? throw new KeyNotFoundException("Channel not found");
            return requestedChannelId.Value;
        }

        if (fallbackChannelId.HasValue)
        {
            _ = await _channelRepository.GetByIdAsync(teamId, fallbackChannelId.Value)
                ?? throw new KeyNotFoundException("Channel not found");
            return fallbackChannelId.Value;
        }

        return null;
    }
}
