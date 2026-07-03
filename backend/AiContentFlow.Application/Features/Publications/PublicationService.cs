using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Publishing;
using AiContentFlow.Application.Features.Publications.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Publications;

public class PublicationService : IPublicationService
{
    private static readonly SocialPlatform[] SupportedPublishPlatforms =
        [SocialPlatform.LinkedIn, SocialPlatform.Facebook, SocialPlatform.Instagram, SocialPlatform.Threads];
    private readonly IContentPostRepository _contentPostRepository;
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly IChannelSocialAccountRepository _channelSocialAccountRepository;
    private readonly IPostVariantRepository _postVariantRepository;
    private readonly IPostPublicationRepository _publicationRepository;
    private readonly IPublishJobRepository _publishJobRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IApplicationTransaction _transaction;

    public PublicationService(
        IContentPostRepository contentPostRepository,
        ISocialAccountRepository socialAccountRepository,
        IChannelSocialAccountRepository channelSocialAccountRepository,
        IPostVariantRepository postVariantRepository,
        IPostPublicationRepository publicationRepository,
        IPublishJobRepository publishJobRepository,
        ITeamRepository teamRepository,
        IApplicationTransaction transaction)
    {
        _contentPostRepository = contentPostRepository;
        _socialAccountRepository = socialAccountRepository;
        _channelSocialAccountRepository = channelSocialAccountRepository;
        _postVariantRepository = postVariantRepository;
        _publicationRepository = publicationRepository;
        _publishJobRepository = publishJobRepository;
        _teamRepository = teamRepository;
        _transaction = transaction;
    }

    public async Task<PublicationResponseDto> ScheduleAsync(Guid teamId, int contentPostId, string requestingUserId, SchedulePublicationDto dto)
    {
        await EnsureCanPublishAsync(teamId, requestingUserId);

        if (dto.ScheduledAt.Kind != DateTimeKind.Utc)
            throw new InvalidOperationException("ScheduledAt must be in UTC");

        if (dto.ScheduledAt <= DateTime.UtcNow)
            throw new InvalidOperationException("ScheduledAt must be in the future");

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");
        EnsurePublishable(contentPost);

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, dto.SocialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        await EnsureAccountAllowedForPostAsync(contentPost, socialAccount);
        if (!socialAccount.IsActive || socialAccount.Status == SocialAccountStatus.Disconnected)
            throw new InvalidOperationException("Social account is not active");
        EnsureSupportedPublishingPlatform(socialAccount.Platform);
        EnsureTokenIsValid(socialAccount);

        var postVariant = EnsureVariantResolved(
            await ResolveVariantAsync(contentPost, socialAccount, dto.PostVariantId),
            socialAccount.Platform);
        EnsureInstagramHasImageIfNeeded(socialAccount.Platform, postVariant, contentPost);
        var idempotencyKey = Normalize(dto.IdempotencyKey);
        var existingPublication = await FindExistingPublicationAsync(
            teamId,
            contentPost.Id,
            socialAccount.Id,
            postVariant.Id,
            dto.ScheduledAt,
            idempotencyKey);

        if (existingPublication is not null)
            return Map(existingPublication);

        var publication = new PostPublication
        {
            TeamId = teamId,
            ContentPostId = contentPost.Id,
            PostVariantId = postVariant.Id,
            SocialAccountId = socialAccount.Id,
            Status = PublicationStatus.Scheduled,
            ScheduledAt = dto.ScheduledAt,
            IdempotencyKey = idempotencyKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var job = new PublishJob
        {
            PostPublication = publication,
            ScheduledAt = dto.ScheduledAt,
            NextAttemptAt = dto.ScheduledAt,
            Status = PublishJobStatus.Pending,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        contentPost.Status = ContentStatus.Scheduled;
        contentPost.UpdatedAt = DateTime.UtcNow;

        await _transaction.ExecuteAsync(async () =>
        {
            await _publicationRepository.AddAsync(publication);
            await _publishJobRepository.AddAsync(job);
            await _contentPostRepository.SaveChangesAsync();
        });

        return Map(publication);
    }

    public async Task<PublicationResponseDto> PublishAsync(Guid teamId, int contentPostId, string requestingUserId, PublishPublicationDto dto)
    {
        await EnsureCanPublishAsync(teamId, requestingUserId);

        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");
        EnsurePublishable(contentPost);

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, dto.SocialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        await EnsureAccountAllowedForPostAsync(contentPost, socialAccount);
        if (!socialAccount.IsActive || socialAccount.Status == SocialAccountStatus.Disconnected)
            throw new InvalidOperationException("Social account is not active");
        EnsureSupportedPublishingPlatform(socialAccount.Platform);
        EnsureTokenIsValid(socialAccount);

        var postVariant = EnsureVariantResolved(
            await ResolveVariantAsync(contentPost, socialAccount, dto.PostVariantId),
            socialAccount.Platform);
        EnsureInstagramHasImageIfNeeded(socialAccount.Platform, postVariant, contentPost);
        var idempotencyKey = Normalize(dto.IdempotencyKey);
        var existingPublication = await FindExistingPublicationAsync(
            teamId,
            contentPost.Id,
            socialAccount.Id,
            postVariant.Id,
            null,
            idempotencyKey);

        if (existingPublication is not null)
            return Map(existingPublication);

        var publication = new PostPublication
        {
            TeamId = teamId,
            ContentPostId = contentPost.Id,
            PostVariantId = postVariant.Id,
            SocialAccountId = socialAccount.Id,
            Status = PublicationStatus.Queued,
            IdempotencyKey = idempotencyKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var job = new PublishJob
        {
            PostPublication = publication,
            ScheduledAt = DateTime.UtcNow,
            NextAttemptAt = DateTime.UtcNow,
            Status = PublishJobStatus.Pending,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _transaction.ExecuteAsync(async () =>
        {
            await _publicationRepository.AddAsync(publication);
            await _publishJobRepository.AddAsync(job);
        });

        return Map(publication);
    }

    public async Task<PublicationResponseDto> GetByIdAsync(Guid teamId, int publicationId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var publication = await _publicationRepository.GetByIdAsync(teamId, publicationId)
            ?? throw new KeyNotFoundException("Publication not found");

        return Map(publication);
    }

    public async Task CancelPendingSchedulesAsync(Guid teamId, int contentPostId)
    {
        var pendingPublications = await _publicationRepository.GetPendingByContentPostAsync(teamId, contentPostId);
        var utcNow = DateTime.UtcNow;

        foreach (var publication in pendingPublications)
        {
            publication.MarkCancelled(utcNow);
            foreach (var job in publication.PublishJobs.Where(j => j.Status == PublishJobStatus.Pending))
            {
                job.Status = PublishJobStatus.DeadLettered;
                job.LastError = "Cancelled";
                job.CompletedAt = utcNow;
                job.DeadLetteredAt = utcNow;
            }
        }

        if (pendingPublications.Count > 0)
            await _publicationRepository.SaveChangesAsync();
    }

    public async Task SyncContentPostPublishedStatusAsync(Guid teamId, int contentPostId)
    {
        var contentPost = await _contentPostRepository.GetByIdAsync(teamId, contentPostId);
        if (contentPost is null)
            return;

        var hasPending = contentPost.Publications.Any(p =>
            p.Status is PublicationStatus.Scheduled
                or PublicationStatus.Queued
                or PublicationStatus.Publishing);

        if (hasPending)
            return;

        if (contentPost.Publications.Any(p => p.Status == PublicationStatus.Published))
        {
            contentPost.Status = ContentStatus.Published;
            contentPost.UpdatedAt = DateTime.UtcNow;
            await _contentPostRepository.SaveChangesAsync();
        }
    }

    private async Task EnsureCanPublishAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can publish content");
    }

    private async Task<PostVariant?> ResolveVariantAsync(ContentPost contentPost, SocialAccount socialAccount, int? postVariantId)
    {
        if (postVariantId.HasValue)
        {
            var variant = await _postVariantRepository.GetByIdAsync(contentPost.TeamId, postVariantId.Value);
            if (variant == null || variant.ContentPostId != contentPost.Id)
                throw new KeyNotFoundException("Post variant not found");

            return variant;
        }

        var variants = await _postVariantRepository.GetByContentPostIdAsync(contentPost.TeamId, contentPost.Id);
        return variants.FirstOrDefault(v => v.Platform == socialAccount.Platform);
    }

    private static PostVariant EnsureVariantResolved(PostVariant? variant, SocialPlatform platform)
    {
        if (variant is null)
        {
            throw new InvalidOperationException(
                $"No saved post variant exists for {platform}. Add a variant for this platform on the post and save before scheduling or publishing.");
        }

        return variant;
    }

    private async Task<PostPublication?> FindExistingPublicationAsync(
        Guid teamId,
        int contentPostId,
        int socialAccountId,
        int? postVariantId,
        DateTime? scheduledAt,
        string? idempotencyKey)
    {
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
            return await _publicationRepository.GetByIdempotencyKeyAsync(teamId, idempotencyKey);

        return await _publicationRepository.GetActiveByIntentAsync(
            teamId,
            contentPostId,
            socialAccountId,
            postVariantId,
            scheduledAt);
    }

    private static void EnsurePublishable(ContentPost contentPost)
    {
        if (contentPost.Status is ContentStatus.Deleted)
            throw new InvalidOperationException("Cannot publish a deleted post");
    }

    private static void EnsureInstagramHasImageIfNeeded(
        SocialPlatform platform,
        PostVariant postVariant,
        ContentPost contentPost)
    {
        if (platform != SocialPlatform.Instagram)
            return;

        if (!VariantContentMerge.HasPublishableImage(postVariant.ContentJson, contentPost.ImageUrl))
        {
            throw new InvalidOperationException(
                "Instagram publishing requires an image. Add shared media on the post and save before scheduling or publishing.");
        }
    }

    private static void EnsureSupportedPublishingPlatform(SocialPlatform platform)
    {
        if (!SupportedPublishPlatforms.Contains(platform))
            throw new InvalidOperationException($"Publishing for platform '{platform}' is not enabled yet.");
    }

    private static void EnsureTokenIsValid(SocialAccount socialAccount)
    {
        if (socialAccount.Platform is SocialPlatform.Facebook or SocialPlatform.Instagram or SocialPlatform.Threads)
        {
            // Page tokens are often effectively long-lived and may not expose a reliable expiry.
            // Defer final validity to the provider call instead of hard-failing here.
            return;
        }

        if (socialAccount.TokenExpiry <= DateTime.UtcNow)
            throw new InvalidOperationException("Social account token has expired. Reconnect the account before publishing.");
    }

    private async Task EnsureAccountAllowedForPostAsync(ContentPost contentPost, SocialAccount socialAccount)
    {
        if (contentPost.TeamId != socialAccount.TeamId)
            throw new InvalidOperationException("Selected social account does not belong to this team.");

        if (!contentPost.ChannelId.HasValue)
            return;

        if (!await _channelSocialAccountRepository.IsLinkedAsync(
                contentPost.TeamId,
                contentPost.ChannelId.Value,
                socialAccount.Id))
        {
            throw new InvalidOperationException(
                "Selected social account is not linked to this post's channel. Link it on Channel → Publishing.");
        }
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static PublicationResponseDto Map(PostPublication publication)
    {
        return new PublicationResponseDto(
            publication.Id,
            publication.TeamId,
            publication.ContentPostId,
            publication.PostVariantId,
            publication.SocialAccountId,
            publication.Status,
            publication.ScheduledAt,
            publication.PublishedAt,
            publication.ExternalPostId,
            publication.ExternalPostUrl,
            publication.ErrorMessage,
            publication.IdempotencyKey,
            publication.RetryCount,
            publication.CreatedAt,
            publication.UpdatedAt);
    }
}
