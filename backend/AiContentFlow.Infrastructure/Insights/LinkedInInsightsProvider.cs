using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Insights;

public class LinkedInInsightsProvider : ISocialInsightsProvider
{
    public SocialPlatform Platform => SocialPlatform.LinkedIn;

    private readonly HttpClient _httpClient;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly ILogger<LinkedInInsightsProvider> _logger;

    public LinkedInInsightsProvider(
        IHttpClientFactory factory,
        ISocialCredentialStore credentialStore,
        ILogger<LinkedInInsightsProvider> logger)
    {
        _httpClient = factory.CreateClient("LinkedIn");
        _credentialStore = credentialStore;
        _logger = logger;
    }

    public async Task<PostInsightsResult?> FetchPostInsightsAsync(
        PostPublication publication,
        SocialAccount account,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publication.ExternalPostId))
            return null;

        var accessToken = await _credentialStore.GetAccessTokenAsync(account);
        _httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        _httpClient.DefaultRequestHeaders.Remove("X-Restli-Protocol-Version");
        _httpClient.DefaultRequestHeaders.Add("X-Restli-Protocol-Version", "2.0.0");

        var encodedUrn = Uri.EscapeDataString(publication.ExternalPostId);
        var response = await _httpClient.GetAsync(
            $"https://api.linkedin.com/v2/socialActions/{encodedUrn}",
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "LinkedIn insights failed for publication {PublicationId}: {Error}",
                publication.Id,
                error);
            return null;
        }

        var payload = await response.Content.ReadFromJsonAsync<LinkedInSocialActionsResponse>(cancellationToken);
        var likes = payload?.LikesSummary?.TotalLikes ?? 0;
        var comments = payload?.CommentsSummary?.TotalFirstLevelComments ?? 0;
        var shares = 0;
        var impressions = Math.Max(likes + comments, 0);
        var clicks = 0;

        return new PostInsightsResult(
            impressions,
            clicks,
            shares,
            InsightsMetricsHelper.CalculateEngagementRate(impressions, clicks, shares, likes, comments));
    }

    private sealed class LinkedInSocialActionsResponse
    {
        [JsonPropertyName("likesSummary")]
        public LinkedInSummary? LikesSummary { get; init; }

        [JsonPropertyName("commentsSummary")]
        public LinkedInSummary? CommentsSummary { get; init; }
    }

    private sealed class LinkedInSummary
    {
        [JsonPropertyName("totalLikes")]
        public int TotalLikes { get; init; }

        [JsonPropertyName("totalFirstLevelComments")]
        public int TotalFirstLevelComments { get; init; }
    }
}
