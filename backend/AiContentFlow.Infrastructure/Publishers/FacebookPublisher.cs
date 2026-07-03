using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiContentFlow.Domain.Models;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Publishing;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Publishers;

public class FacebookPublisher : IPublisher
{
    public SocialPlatform Platform => SocialPlatform.Facebook;

    private readonly HttpClient _httpClient;
    private readonly ILogger<FacebookPublisher> _logger;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly string _graphApiBaseUrl;

    public FacebookPublisher(
        IHttpClientFactory factory,
        ILogger<FacebookPublisher> logger,
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
                return PublishResult.Failure("Facebook page ID is missing");

            if (string.IsNullOrEmpty(post.ContentJson))
                return PublishResult.Failure("PostVariant has no ContentJson");

            var (text, imageUrl) = ContentJsonParser.Extract(post.ContentJson);
            if (string.IsNullOrWhiteSpace(text))
                return PublishResult.Failure("Invalid ContentJson: 'text' is empty or missing");

            var accessToken = await _credentialStore.GetAccessTokenAsync(account);
            return string.IsNullOrWhiteSpace(imageUrl)
                ? await PublishTextAsync(account.ExternalAccountId, accessToken, text)
                : await PublishPhotoAsync(account.ExternalAccountId, accessToken, text, imageUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook publish failed for account {AccountId}", account.Id);
            return PublishResult.Failure(ex.Message);
        }
    }

    private async Task<PublishResult> PublishTextAsync(string pageId, string accessToken, string message)
    {
        var payload = new Dictionary<string, string>
        {
            ["message"] = message,
            ["access_token"] = accessToken
        };

        var response = await _httpClient.PostAsync($"{_graphApiBaseUrl}/{pageId}/feed", new FormUrlEncodedContent(payload));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Facebook feed post failed: {Error}", error);
            return PublishResult.Failure(error);
        }

        var result = await response.Content.ReadFromJsonAsync<FacebookPostResponse>();
        var postId = result?.Id ?? string.Empty;
        var postUrl = string.IsNullOrWhiteSpace(postId)
            ? null
            : $"https://www.facebook.com/{postId}";

        return PublishResult.Success(postId, postUrl ?? string.Empty);
    }

    private async Task<PublishResult> PublishPhotoAsync(string pageId, string accessToken, string message, string imageUrl)
    {
            if (PublishLocalImageHelper.TryResolveLocalPath(imageUrl, out var localPath))
            {
                return await PublishPhotoFromFileAsync(pageId, accessToken, message, localPath);
            }

        var payload = new Dictionary<string, string>
        {
            ["message"] = message,
            ["url"] = imageUrl,
            ["access_token"] = accessToken
        };

        var response = await _httpClient.PostAsync($"{_graphApiBaseUrl}/{pageId}/photos", new FormUrlEncodedContent(payload));
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Facebook photo post failed: {Error}", error);
            return PublishResult.Failure(error);
        }

        var result = await response.Content.ReadFromJsonAsync<FacebookPostResponse>();
        var postId = result?.PostId ?? result?.Id ?? string.Empty;
        var postUrl = string.IsNullOrWhiteSpace(postId)
            ? null
            : $"https://www.facebook.com/{postId}";

        return PublishResult.Success(postId, postUrl ?? string.Empty);
    }

    private async Task<PublishResult> PublishPhotoFromFileAsync(string pageId, string accessToken, string message, string filePath)
    {
        if (!File.Exists(filePath))
            return PublishResult.Failure($"Image file not found: {filePath}");

        using var form = new MultipartFormDataContent
        {
            { new StringContent(message), "message" },
            { new StringContent(accessToken), "access_token" }
        };

        await using var stream = File.OpenRead(filePath);
        var imageContent = new StreamContent(stream);
        form.Add(imageContent, "source", Path.GetFileName(filePath));

        var response = await _httpClient.PostAsync($"{_graphApiBaseUrl}/{pageId}/photos", form);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Facebook photo upload from file failed: {Error}", error);
            return PublishResult.Failure(error);
        }

        var result = await response.Content.ReadFromJsonAsync<FacebookPostResponse>();
        var postId = result?.PostId ?? result?.Id ?? string.Empty;
        var postUrl = string.IsNullOrWhiteSpace(postId)
            ? null
            : $"https://www.facebook.com/{postId}";

        return PublishResult.Success(postId, postUrl ?? string.Empty);
    }

}

public class FacebookPostResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("post_id")]
    public string? PostId { get; set; }
}
