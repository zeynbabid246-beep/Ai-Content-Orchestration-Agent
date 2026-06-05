using AiContentFlow.Application.Common;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Services;
using AiContentFlow.Application.Features.Publications;
using AiContentFlow.Application.Features.Publications.Dtos;
using AiContentFlow.Domain.Campaigns.Dtos;
using AiContentFlow.Domain.Campaigns.Interfaces;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.Campaigns;

public class CampaignService : ICampaignService
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly IContentPostRepository _contentPostRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IChannelRepository _channelRepository;
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly IPublicationService _publicationService;
    private readonly ITeamActivityService _activityService;
    private readonly IValidator<CreateCampaignDto> _createValidator;
    private readonly IValidator<UpdateCampaignDto> _updateValidator;

    public CampaignService(
        ICampaignRepository campaignRepository,
        IContentPostRepository contentPostRepository,
        ITeamRepository teamRepository,
        IChannelRepository channelRepository,
        IBrandStudioRepository brandStudioRepository,
        IPublicationService publicationService,
        ITeamActivityService activityService,
        IValidator<CreateCampaignDto> createValidator,
        IValidator<UpdateCampaignDto> updateValidator)
    {
        _campaignRepository = campaignRepository;
        _contentPostRepository = contentPostRepository;
        _teamRepository = teamRepository;
        _channelRepository = channelRepository;
        _brandStudioRepository = brandStudioRepository;
        _publicationService = publicationService;
        _activityService = activityService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<CampaignResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateCampaignDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);

        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        await EnsureCanMutateAsync(teamId, requestingUserId);

        var normalizedName = NormalizeRequired(dto.Name);

        if (await _campaignRepository.ExistsByNameAsync(teamId, normalizedName))
            throw new InvalidOperationException("Campaign name already exists for this team");

        _ = await _channelRepository.GetByIdAsync(teamId, dto.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var defaults = await _brandStudioRepository.GetByTeamAsync(teamId);

        var campaign = new Campaign
        {
            TeamId = teamId,
            Name = normalizedName,
            Description = Normalize(dto.Description),
            ChannelId = dto.ChannelId,
            Objective = Normalize(dto.Objective) ?? defaults?.DefaultCampaignObjective,
            ToneOfVoiceOverride = Normalize(dto.ToneOfVoiceOverride) ?? defaults?.DefaultToneOfVoice,
            TargetAudienceOverride = Normalize(dto.TargetAudienceOverride) ?? defaults?.DefaultTargetAudience,
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _campaignRepository.AddAsync(campaign);
        await _campaignRepository.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.CampaignCreated,
            "Campaign",
            campaign.Id.ToString());

        return Map(campaign, Array.Empty<ContentPost>());
    }

    public async Task<List<CampaignResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var campaigns = await _campaignRepository.GetByTeamAsync(teamId);
        return campaigns.Select(c => Map(c, Array.Empty<ContentPost>())).ToList();
    }

    public async Task<CampaignResponseDto> GetByIdAsync(Guid teamId, int campaignId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        var posts = await _contentPostRepository.GetByCampaignAsync(teamId, campaignId);
        return Map(campaign, posts);
    }

    public async Task<CampaignResponseDto> UpdateAsync(Guid teamId, int campaignId, string requestingUserId, UpdateCampaignDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);
        await EnsureCanMutateAsync(teamId, requestingUserId);

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        var normalizedName = NormalizeRequired(dto.Name);

        if (await _campaignRepository.ExistsByNameAsync(teamId, normalizedName, campaignId))
            throw new InvalidOperationException("Campaign name already exists for this team");

        _ = await _channelRepository.GetByIdAsync(teamId, dto.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        campaign.Name = normalizedName;
        campaign.Description = Normalize(dto.Description);
        campaign.ChannelId = dto.ChannelId;
        campaign.Objective = string.IsNullOrWhiteSpace(dto.Objective) ? campaign.Objective : dto.Objective.Trim();
        campaign.ToneOfVoiceOverride = string.IsNullOrWhiteSpace(dto.ToneOfVoiceOverride) ? campaign.ToneOfVoiceOverride : dto.ToneOfVoiceOverride.Trim();
        campaign.TargetAudienceOverride = string.IsNullOrWhiteSpace(dto.TargetAudienceOverride) ? campaign.TargetAudienceOverride : dto.TargetAudienceOverride.Trim();
        campaign.Status = dto.Status;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _campaignRepository.SaveChangesAsync();

        var posts = await _contentPostRepository.GetByCampaignAsync(teamId, campaignId);
        return Map(campaign, posts);
    }

    public async Task DeleteAsync(Guid teamId, int campaignId, string requestingUserId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        campaign.IsDeleted = true;
        campaign.DeletedAt = DateTime.UtcNow;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _campaignRepository.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.CampaignDeleted,
            "Campaign",
            campaign.Id.ToString());
    }

    public async Task LinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        if (contentPost.CampaignId == campaignId)
            throw new InvalidOperationException("Content post is already linked to this campaign");

        if (contentPost.CampaignId.HasValue && contentPost.CampaignId != campaignId)
            throw new InvalidOperationException("Content post is already linked to another campaign. Unlink it first.");

        if (contentPost.ChannelId != campaign.ChannelId)
            throw new InvalidOperationException("Content post must belong to the same channel as the campaign.");

        contentPost.CampaignId = campaignId;
        contentPost.UpdatedAt = DateTime.UtcNow;
        await _contentPostRepository.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.CampaignPostLinked,
            "ContentPost",
            contentPost.Id.ToString(),
            $"{{\"campaignId\":{campaignId}}}");
    }

    public async Task UnlinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        _ = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        if (contentPost.CampaignId != campaignId)
            throw new KeyNotFoundException("Campaign-content post link not found");

        contentPost.CampaignId = null;
        contentPost.UpdatedAt = DateTime.UtcNow;
        await _contentPostRepository.SaveChangesAsync();
    }

    public async Task<BulkCreateCampaignPostsResponseDto> BulkCreatePostsAsync(
        Guid teamId,
        int campaignId,
        string requestingUserId,
        BulkCreateCampaignPostsDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        if (dto.Posts.Count == 0)
            throw new InvalidOperationException("At least one post is required.");

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        var createdIds = new List<int>();

        foreach (var item in dto.Posts)
        {
            var contentPost = new ContentPost
            {
                TeamId = teamId,
                ChannelId = campaign.ChannelId,
                CampaignId = campaign.Id,
                Title = Normalize(item.Title),
                ContentType = item.ContentType,
                ContentJson = JsonContentValidator.Normalize(item.ContentJson),
                Status = ContentStatus.Draft,
                CreatedByUserId = requestingUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (item.Platform.HasValue)
            {
                contentPost.PostVariants.Add(new PostVariant
                {
                    Platform = item.Platform.Value,
                    ContentJson = contentPost.ContentJson,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _contentPostRepository.AddAsync(contentPost);
            await _contentPostRepository.SaveChangesAsync();
            createdIds.Add(contentPost.Id);

            if (item.ScheduledAt.HasValue && item.SocialAccountId.HasValue)
            {
                await _publicationService.ScheduleAsync(
                    teamId,
                    contentPost.Id,
                    requestingUserId,
                    new SchedulePublicationDto(
                        item.SocialAccountId.Value,
                        contentPost.PostVariants.FirstOrDefault()?.Id,
                        item.ScheduledAt.Value,
                        null));
            }
        }

        return new BulkCreateCampaignPostsResponseDto(createdIds.Count, createdIds);
    }

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin && membership.Role != TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin/Editor can manage campaigns");
    }

    private static CampaignResponseDto Map(Campaign campaign, IReadOnlyList<ContentPost> linkedPosts)
    {
        var contentPosts = linkedPosts
            .Select(p => new CampaignContentPostResponseDto(
                p.Id,
                p.UpdatedAt,
                p.CreatedByUserId))
            .ToList();

        return new CampaignResponseDto(
            campaign.Id,
            campaign.TeamId,
            campaign.ChannelId,
            campaign.Name,
            campaign.Description,
            campaign.Objective,
            campaign.ToneOfVoiceOverride,
            campaign.TargetAudienceOverride,
            campaign.Status,
            campaign.CreatedAt,
            campaign.UpdatedAt,
            contentPosts);
    }

    private static string NormalizeRequired(string value)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("Campaign name is required");

        return normalized;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
