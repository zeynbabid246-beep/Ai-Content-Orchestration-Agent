using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Infrastructure.Factories;

public class InsightsProviderFactory : IInsightsProviderFactory
{
    private readonly IEnumerable<ISocialInsightsProvider> _providers;

    public InsightsProviderFactory(IEnumerable<ISocialInsightsProvider> providers)
    {
        _providers = providers;
    }

    public ISocialInsightsProvider? GetProvider(SocialPlatform platform)
    {
        return _providers.FirstOrDefault(p => p.Platform == platform);
    }
}
