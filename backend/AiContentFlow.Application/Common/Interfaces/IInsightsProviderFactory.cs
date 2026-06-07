using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IInsightsProviderFactory
{
    ISocialInsightsProvider? GetProvider(SocialPlatform platform);
}
