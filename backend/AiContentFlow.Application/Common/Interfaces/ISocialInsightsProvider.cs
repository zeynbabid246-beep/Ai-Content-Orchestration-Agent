using AiContentFlow.Application.Common.Models;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ISocialInsightsProvider
{
    SocialPlatform Platform { get; }

    Task<PostInsightsResult?> FetchPostInsightsAsync(
        PostPublication publication,
        SocialAccount account,
        CancellationToken cancellationToken = default);
}
