using System.Net.Http.Json;
using System.Text.Json.Serialization;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Insights;

public class InstagramInsightsProvider : ISocialInsightsProvider
{
    public SocialPlatform Platform => SocialPlatform.Instagram;

    private readonly HttpClient _httpClient;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly ILogger<InstagramInsightsProvider> _logger;
    private readonly string _graphApiBaseUrl;

    public InstagramInsightsProvider(
        IHttpClientFactory factory,
        ISocialCredentialStore credentialStore,
        ILogger<InstagramInsightsProvider> logger,
        IConfiguration configuration)
    {
        _httpClient = factory.CreateClient("Facebook");
        _credentialStore = credentialStore;
        _logger = logger;
        var graphVersion = configuration["Meta:GraphApiVersion"] ?? "v22.0";
        _graphApiBaseUrl = $"https://graph.facebook.com/{graphVersion}";
    }

    public async Task<PostInsightsResult?> FetchPostInsightsAsync(
        PostPublication publication,
        SocialAccount account,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publication.ExternalPostId))
            return null;

        var accessToken = await _credentialStore.GetAccessTokenAsync(account);
        var metrics = "impressions,reach,total_interactions";
        var url =
            $"{_graphApiBaseUrl}/{publication.ExternalPostId}/insights?metric={metrics}&access_token={Uri.EscapeDataString(accessToken)}";

        var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "Instagram insights failed for publication {PublicationId}: {Error}",
                publication.Id,
                error);
            return null;
        }

        var payload = await response.Content.ReadFromJsonAsync<MetaInsightsResponse>(cancellationToken);
        var impressions = GetMetricValue(payload, "impressions", "reach");
        var interactions = GetMetricValue(payload, "total_interactions");
        var clicks = 0;
        var shares = 0;

        return new PostInsightsResult(
            impressions,
            clicks,
            shares,
            InsightsMetricsHelper.CalculateEngagementRate(impressions, clicks, shares, interactions));
    }

    private static int GetMetricValue(MetaInsightsResponse? payload, params string[] metricNames)
    {
        foreach (var metricName in metricNames)
        {
            var metric = payload?.Data?.FirstOrDefault(m =>
                string.Equals(m.Name, metricName, StringComparison.OrdinalIgnoreCase));
            var value = (int)(metric?.Values?.LastOrDefault()?.Value ?? 0);
            if (value > 0)
                return value;
        }

        return 0;
    }

    private sealed class MetaInsightsResponse
    {
        [JsonPropertyName("data")]
        public List<MetaInsightMetric>? Data { get; init; }
    }

    private sealed class MetaInsightMetric
    {
        [JsonPropertyName("name")]
        public string? Name { get; init; }

        [JsonPropertyName("values")]
        public List<MetaInsightValue>? Values { get; init; }
    }

    private sealed class MetaInsightValue
    {
        [JsonPropertyName("value")]
        public long Value { get; init; }
    }
}
