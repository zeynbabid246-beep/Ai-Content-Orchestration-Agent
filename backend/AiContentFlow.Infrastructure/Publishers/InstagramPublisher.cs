using System.Net.Http.Json;
using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Publishers;

public class InstagramPublisher : IPublisher
{
    public SocialPlatform Platform => SocialPlatform.Instagram;

    private readonly HttpClient _httpClient;
    private readonly ILogger<InstagramPublisher> _logger;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly string _graphApiBaseUrl;

    public InstagramPublisher(
        IHttpClientFactory factory,
        ILogger<InstagramPublisher> logger,
        ISocialCredentialStore credentialStore,
        IConfiguration configuration)
    {
        _httpClient = factory.CreateClient("Facebook");
        _logger = logger;
        _credentialStore = credentialStore;
        var graphVersion = configuration["Meta:GraphApiVersion"] ?? "v22.0";
        _graphApiBaseUrl = $"https://graph.facebook.com/{graphVersion}";
    }

    public async Task<PublishResult> PublishAsync(PostVariant post, SocialAccount account)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(account.ExternalAccountId))
                return PublishResult.Failure("Instagram business account ID is missing");

            if (string.IsNullOrEmpty(post.ContentJson))
                return PublishResult.Failure("PostVariant has no ContentJson");

            var content = JsonSerializer.Deserialize<JsonElement>(post.ContentJson);
            if (!content.TryGetProperty("text", out var textProp))
                return PublishResult.Failure("Invalid ContentJson: missing 'text' field");

            var caption = textProp.GetString() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(caption))
                return PublishResult.Failure("Invalid ContentJson: 'text' is empty");

            string? imageUrl = null;
            if (content.TryGetProperty("imageUrl", out var imageProp))
                imageUrl = imageProp.GetString();

            if (string.IsNullOrWhiteSpace(imageUrl))
                return PublishResult.Failure("Instagram publishing requires an imageUrl in ContentJson");

            var accessToken = await _credentialStore.GetAccessTokenAsync(account);
            var creationId = await CreateMediaContainerAsync(account.ExternalAccountId, accessToken, imageUrl, caption);
            var publishId = await PublishMediaAsync(account.ExternalAccountId, accessToken, creationId);
            return PublishResult.Success(publishId, string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram publish failed for account {AccountId}", account.Id);
            return PublishResult.Failure(ex.Message);
        }
    }

    private async Task<string> CreateMediaContainerAsync(string igUserId, string accessToken, string imageUrl, string caption)
    {
        var payload = new Dictionary<string, string>
        {
            ["image_url"] = imageUrl,
            ["caption"] = caption,
            ["access_token"] = accessToken
        };

        var response = await _httpClient.PostAsync(
            $"{_graphApiBaseUrl}/{igUserId}/media",
            new FormUrlEncodedContent(payload));

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Instagram media creation failed: {error}");
        }

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("id").GetString()
            ?? throw new InvalidOperationException("Instagram media creation returned no id");
    }

    private async Task<string> PublishMediaAsync(string igUserId, string accessToken, string creationId)
    {
        var payload = new Dictionary<string, string>
        {
            ["creation_id"] = creationId,
            ["access_token"] = accessToken
        };

        var response = await _httpClient.PostAsync(
            $"{_graphApiBaseUrl}/{igUserId}/media_publish",
            new FormUrlEncodedContent(payload));

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Instagram publish failed: {error}");
        }

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("id").GetString()
            ?? throw new InvalidOperationException("Instagram publish returned no id");
    }
}
