using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Workers;

public class SocialTokenRefreshJob
{
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly ILogger<SocialTokenRefreshJob> _logger;

    public SocialTokenRefreshJob(
        ISocialAccountRepository socialAccountRepository,
        ILogger<SocialTokenRefreshJob> logger)
    {
        _socialAccountRepository = socialAccountRepository;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var threshold = DateTime.UtcNow.AddDays(7);
        var accounts = await _socialAccountRepository.GetExpiringBeforeAsync(threshold);

        foreach (var account in accounts)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            if (account.TokenExpiry <= DateTime.UtcNow)
            {
                account.Status = SocialAccountStatus.Disconnected;
                account.IsActive = false;
                account.UpdatedAt = DateTime.UtcNow;
                _logger.LogWarning(
                    "Social account {AccountId} ({Platform}) expired; marked disconnected.",
                    account.Id,
                    account.Platform);
            }
            else
            {
                _logger.LogInformation(
                    "Social account {AccountId} ({Platform}) expires at {Expiry}. Reconnect before expiry.",
                    account.Id,
                    account.Platform,
                    account.TokenExpiry);
            }
        }

        await _socialAccountRepository.SaveChangesAsync();
    }
}
