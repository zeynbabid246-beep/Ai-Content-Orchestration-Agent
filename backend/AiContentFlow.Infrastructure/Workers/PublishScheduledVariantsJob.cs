using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Workers;

public class PublishScheduledVariantsJob
{
    private readonly AppDbContext _db;
    private readonly IPublisherFactory _publisherFactory;
    private readonly ILogger<PublishScheduledVariantsJob> _logger;

    public PublishScheduledVariantsJob(
        AppDbContext db,
        IPublisherFactory publisherFactory,
        ILogger<PublishScheduledVariantsJob> logger)
    {
        _db = db;
        _publisherFactory = publisherFactory;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var dueVariants = await _db.PostVariants
                .Include(v => v.ContentPost)
                .Include(v => v.SocialAccount)
                .Where(v => v.Status == ContentStatus.Scheduled
                         && v.ContentPost != null
                         && v.ContentPost.ScheduledAt <= DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var variant in dueVariants)
            {
                try
                {
                    if (variant.SocialAccount == null || !variant.SocialAccount.IsActive || variant.SocialAccount.Status == SocialAccountStatus.Disconnected)
                    {
                        variant.Status = ContentStatus.Failed;
                        variant.LastError = "Social account not found or inactive";
                        variant.RetryCount++;
                        if (variant.ContentPost != null)
                        {
                            variant.ContentPost.Status = ContentStatus.Failed;
                            variant.ContentPost.LastError = variant.LastError;
                            variant.ContentPost.RetryCount++;
                            variant.ContentPost.UpdatedAt = DateTime.UtcNow;
                        }
                        continue;
                    }

                    var publisher = _publisherFactory.GetPublisher(variant.SocialAccount.Platform);
                    var result = await publisher.PublishAsync(variant, variant.SocialAccount);

                    if (result.IsSuccess)
                    {
                        variant.Status = ContentStatus.Published;
                        variant.PlatformPostId = result.PostId;
                        variant.PlatformPostUrl = result.PostUrl;
                        variant.PublishedAt = DateTime.UtcNow;
                        variant.UpdatedAt = DateTime.UtcNow;

                        if (variant.ContentPost != null)
                        {
                            variant.ContentPost.Status = ContentStatus.Published;
                            variant.ContentPost.PublishedAt = DateTime.UtcNow;
                            variant.ContentPost.PlatformPostId = result.PostId;
                            variant.ContentPost.PlatformPostUrl = result.PostUrl;
                            variant.ContentPost.LastError = null;
                            variant.ContentPost.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    else
                    {
                        variant.Status = ContentStatus.Failed;
                        variant.LastError = result.ErrorMessage;
                        variant.RetryCount++;
                        variant.UpdatedAt = DateTime.UtcNow;

                        if (variant.ContentPost != null)
                        {
                            variant.ContentPost.Status = ContentStatus.Failed;
                            variant.ContentPost.LastError = result.ErrorMessage;
                            variant.ContentPost.RetryCount++;
                            variant.ContentPost.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish variant {VariantId}", variant.Id);
                    variant.Status = ContentStatus.Failed;
                    variant.LastError = ex.Message;
                    variant.RetryCount++;
                    variant.UpdatedAt = DateTime.UtcNow;

                    if (variant.ContentPost != null)
                    {
                        variant.ContentPost.Status = ContentStatus.Failed;
                        variant.ContentPost.LastError = ex.Message;
                        variant.ContentPost.RetryCount++;
                        variant.ContentPost.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PublishScheduledVariantsJob encountered an error");
        }
    }
}
