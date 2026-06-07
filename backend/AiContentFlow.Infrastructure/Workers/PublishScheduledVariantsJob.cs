using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Publishing;
using AiContentFlow.Application.Features.Publications;
using AiContentFlow.Domain.Models;
using Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Workers;

public class PublishScheduledVariantsJob
{
    private const int BatchSize = 25;
    private static readonly SocialPlatform[] SupportedPublishPlatforms =
        [SocialPlatform.LinkedIn, SocialPlatform.Facebook, SocialPlatform.Instagram];
    private readonly IPublishJobRepository _publishJobRepository;
    private readonly IPostPublicationRepository _publicationRepository;
    private readonly IPublisherFactory _publisherFactory;
    private readonly IPostVariantRepository _postVariantRepository;
    private readonly IContentPostRepository _contentPostRepository;
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly IPublicationService _publicationService;
    private readonly ILogger<PublishScheduledVariantsJob> _logger;

    public PublishScheduledVariantsJob(
        IPublishJobRepository publishJobRepository,
        IPostPublicationRepository publicationRepository,
        IPostVariantRepository postVariantRepository,
        IContentPostRepository contentPostRepository,
        ISocialAccountRepository socialAccountRepository,
        IPublisherFactory publisherFactory,
        IPublicationService publicationService,
        ILogger<PublishScheduledVariantsJob> logger)
    {
        _publishJobRepository = publishJobRepository;
        _publicationRepository = publicationRepository;
        _postVariantRepository = postVariantRepository;
        _contentPostRepository = contentPostRepository;
        _socialAccountRepository = socialAccountRepository;
        _publisherFactory = publisherFactory;
        _publicationService = publicationService;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var workerId = $"{Environment.MachineName}:{Guid.NewGuid():N}";

        try
        {
            var dueJobs = await _publishJobRepository.ClaimDueAsync(DateTime.UtcNow, BatchSize, workerId);

            foreach (var job in dueJobs)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                try
                {
                    var publication = job.PostPublication
                        ?? throw new InvalidOperationException("Publication not found");

                    if (publication.TeamId == Guid.Empty)
                        throw new InvalidOperationException("Publication tenant is invalid");

                    var socialAccount = await _socialAccountRepository.GetByIdAsync(publication.TeamId, publication.SocialAccountId);
                    if (socialAccount == null || !socialAccount.IsActive || socialAccount.Status == SocialAccountStatus.Disconnected)
                    {
                        publication.MarkFailed("Social account not found or inactive", DateTime.UtcNow);
                        job.MarkFailed(publication.ErrorMessage, DateTime.UtcNow);
                        await SaveProgressAsync();
                        continue;
                    }

                    if (!SupportedPublishPlatforms.Contains(socialAccount.Platform))
                    {
                        publication.MarkFailed($"Publishing for platform '{socialAccount.Platform}' is not enabled yet", DateTime.UtcNow);
                        job.MarkFailed(publication.ErrorMessage, DateTime.UtcNow);
                        await SaveProgressAsync();
                        continue;
                    }

                    if (socialAccount.Platform is not (SocialPlatform.Facebook or SocialPlatform.Instagram)
                        && socialAccount.TokenExpiry <= DateTime.UtcNow)
                    {
                        socialAccount.Status = SocialAccountStatus.Disconnected;
                        socialAccount.UpdatedAt = DateTime.UtcNow;
                        publication.MarkFailed("Social account token has expired. Reconnect the account before publishing.", DateTime.UtcNow);
                        job.MarkFailed(publication.ErrorMessage, DateTime.UtcNow);
                        await SaveProgressAsync();
                        continue;
                    }

                    PostVariant? variant = null;
                    if (publication.PostVariantId.HasValue)
                    {
                        variant = await _postVariantRepository.GetByIdAsync(publication.TeamId, publication.PostVariantId.Value);
                    }

                    if (variant == null)
                    {
                        var variants = await _postVariantRepository.GetByContentPostIdAsync(publication.TeamId, publication.ContentPostId);
                        variant = variants.FirstOrDefault(v => v.Platform == socialAccount.Platform);
                    }

                    if (variant == null)
                    {
                        publication.MarkFailed(
                            "Post variant not found for publication. Re-save the post with a variant for this platform, then publish again.",
                            DateTime.UtcNow);
                        job.MarkFailed(publication.ErrorMessage ?? "Variant missing", DateTime.UtcNow);
                        await SaveProgressAsync();
                        continue;
                    }

                    var contentPost = await _contentPostRepository.GetByIdAsync(
                        publication.TeamId,
                        publication.ContentPostId);

                    if (socialAccount.Platform == SocialPlatform.Instagram
                        && !VariantContentMerge.HasPublishableImage(variant.ContentJson, contentPost?.ImageUrl))
                    {
                        publication.MarkFailed(
                            "Instagram publishing requires an image. Add shared media on the post and save before scheduling or publishing.",
                            DateTime.UtcNow);
                        job.MarkFailed(publication.ErrorMessage ?? "Image required", DateTime.UtcNow);
                        await SaveProgressAsync();
                        continue;
                    }

                    var publishVariant = new PostVariant
                    {
                        Id = variant.Id,
                        ContentPostId = variant.ContentPostId,
                        Platform = variant.Platform,
                        Title = variant.Title,
                        ContentJson = VariantContentMerge.MergePostImageIntoContentJson(
                            variant.ContentJson,
                            contentPost?.ImageUrl),
                    };

                    var publisher = _publisherFactory.GetPublisher(socialAccount.Platform);
                    publication.MarkPublishing(DateTime.UtcNow);
                    await SaveProgressAsync();

                    var result = await publisher.PublishAsync(publishVariant, socialAccount);

                    if (result.IsSuccess)
                    {
                        publication.MarkPublished(result.PostId, result.PostUrl, DateTime.UtcNow);
                        job.MarkSucceeded(DateTime.UtcNow);
                        await SaveProgressAsync();
                        await _publicationService.SyncContentPostPublishedStatusAsync(
                            publication.TeamId,
                            publication.ContentPostId);
                    }
                    else
                    {
                        publication.MarkFailed(result.ErrorMessage, DateTime.UtcNow);
                        job.MarkFailed(result.ErrorMessage, DateTime.UtcNow);
                    }

                    await SaveProgressAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish scheduled job {JobId}", job.Id);
                    job.PostPublication?.MarkFailed(ex.Message, DateTime.UtcNow);
                    job.MarkFailed(ex.Message, DateTime.UtcNow);
                    await SaveProgressAsync();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PublishScheduledVariantsJob encountered an error");
        }
    }

    private async Task SaveProgressAsync()
    {
        await _socialAccountRepository.SaveChangesAsync();
        await _publishJobRepository.SaveChangesAsync();
        await _publicationRepository.SaveChangesAsync();
    }
}
