using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Workers;

public class PublishWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<PublishWorker> _logger;

    public PublishWorker(IServiceProvider services, ILogger<PublishWorker> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var publisherFactory = scope.ServiceProvider.GetRequiredService<IPublisherFactory>();

                var dueVariants = await db.PostVariants
                    .Include(v => v.ContentPost)        
                    .Include(v => v.SocialAccount)     
                    .Where(v => v.Status == ContentStatus.Scheduled
                             && v.ContentPost != null
                             && v.ContentPost.ScheduledAt <= DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                foreach (var variant in dueVariants)
                {
                    try
                    {
                       
                        if (variant.SocialAccount == null || !variant.SocialAccount.IsActive)
                        {
                            variant.Status = ContentStatus.Failed;
                            variant.LastError = "Social account not found or inactive";
                            continue;
                        }

                        var publisher = publisherFactory.GetPublisher(variant.SocialAccount.Platform);
                        var result = await publisher.PublishAsync(variant, variant.SocialAccount);

                        if (result.IsSuccess)
                        {
                            variant.Status = ContentStatus.Published;
                            variant.PlatformPostId = result.PostId;
                            variant.PlatformPostUrl = result.PostUrl;
                            variant.PublishedAt = DateTime.UtcNow;
                        }
                        else
                        {
                            variant.Status = ContentStatus.Failed;
                            variant.LastError = result.ErrorMessage;
                            variant.RetryCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to publish variant {VariantId}", variant.Id);
                        variant.Status = ContentStatus.Failed;
                        variant.LastError = ex.Message;
                        variant.RetryCount++;
                    }
                }

                await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                // 
                _logger.LogError(ex, "PublishWorker encountered an error");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}