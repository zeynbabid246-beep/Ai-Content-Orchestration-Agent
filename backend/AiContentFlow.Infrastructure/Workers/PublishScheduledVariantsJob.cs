using AiContentFlow.Application.Common.Interfaces;
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
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly ILogger<PublishScheduledVariantsJob> _logger;

    public PublishScheduledVariantsJob(
        IPublishJobRepository publishJobRepository,
        IPostPublicationRepository publicationRepository,
        IPostVariantRepository postVariantRepository,
        ISocialAccountRepository socialAccountRepository,
        IPublisherFactory publisherFactory,
        ILogger<PublishScheduledVariantsJob> logger)
    {
        _publishJobRepository = publishJobRepository;
        _publicationRepository = publicationRepository;
        _postVariantRepository = postVariantRepository;
        _socialAccountRepository = socialAccountRepository;
        _publisherFactory = publisherFactory;
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

                    if (socialAccount.TokenExpiry <= DateTime.UtcNow)
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

                    var publisher = _publisherFactory.GetPublisher(socialAccount.Platform);
                    publication.MarkPublishing(DateTime.UtcNow);
                    await SaveProgressAsync();

                    var result = await publisher.PublishAsync(variant, socialAccount);

                    if (result.IsSuccess)
                    {
                        publication.MarkPublished(result.PostId, result.PostUrl, DateTime.UtcNow);
                        job.MarkSucceeded(DateTime.UtcNow);
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
