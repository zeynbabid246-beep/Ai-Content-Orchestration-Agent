using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiContentFlow.Domain.Models;
using AiContentFlow.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Application.DTOs;
using Application.Interfaces;

namespace AiContentFlow.Infrastructure.Publishers;

public class LinkedInPublisher : IPublisher
{
    public SocialPlatform Platform => SocialPlatform.LinkedIn;

    private readonly HttpClient _httpClient;
    private readonly ILogger<LinkedInPublisher> _logger;

    public LinkedInPublisher(IHttpClientFactory factory, ILogger<LinkedInPublisher> logger)
    {
        _httpClient = factory.CreateClient("LinkedIn");
        _logger = logger;
    }

    public async Task<PublishResult> PublishAsync(PostVariant variant, SocialAccount account)
    {
        try
        {
            if (string.IsNullOrEmpty(variant.ContentJson))
                return PublishResult.Failure("PostVariant has no ContentJson");

            var content = JsonSerializer.Deserialize<JsonElement>(variant.ContentJson);

            if (!content.TryGetProperty("text", out var textProp))
                return PublishResult.Failure("Invalid ContentJson: missing 'text' field");

            var text = textProp.GetString() ?? "";
            if (string.IsNullOrWhiteSpace(text))
                return PublishResult.Failure("Invalid ContentJson: 'text' is empty");

            string? imageUrl = null;
            if (content.TryGetProperty("imageUrl", out var imgProp))
                imageUrl = imgProp.GetString();

            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", account.OAuthToken);
            _httpClient.DefaultRequestHeaders.Remove("X-Restli-Protocol-Version");
            _httpClient.DefaultRequestHeaders.Add("X-Restli-Protocol-Version", "2.0.0");

            var author = $"urn:li:member:{account.PlatformAccountId}";

            string? imageAssetUrn = null;
            if (!string.IsNullOrEmpty(imageUrl))
                imageAssetUrn = await UploadImageAsync(imageUrl, author);

            var result = await TryPublish(text, author, imageAssetUrn);
            if (result.IsSuccess)
                return result;

            // 🔁 Fallback to person URN
            _logger.LogWarning("LinkedIn publish failed with member URN → retrying with person URN");

            var fallbackAuthor = $"urn:li:person:{account.PlatformAccountId}";
            imageAssetUrn = null;

            if (!string.IsNullOrEmpty(imageUrl))
                imageAssetUrn = await UploadImageAsync(imageUrl, fallbackAuthor);

            return await TryPublish(text, fallbackAuthor, imageAssetUrn);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LinkedIn publish failed for account {AccountId}", account.Id);
            return PublishResult.Failure(ex.Message);
        }
    }

    private async Task<PublishResult> TryPublish(string text, string author, string? imageAssetUrn)
    {
        object specificContent = imageAssetUrn != null
            ? new Dictionary<string, object>
            {
                ["com.linkedin.ugc.ShareContent"] = new
                {
                    shareCommentary = new { text },
                    shareMediaCategory = "IMAGE",
                    media = new[] { new { status = "READY", media = imageAssetUrn } }
                }
            }
            : new Dictionary<string, object>
            {
                ["com.linkedin.ugc.ShareContent"] = new
                {
                    shareCommentary = new { text },
                    shareMediaCategory = "NONE"
                }
            };

        var requestBody = new
        {
            author,
            lifecycleState = "PUBLISHED",
            specificContent,
            visibility = new Dictionary<string, object>
            {
                ["com.linkedin.ugc.MemberNetworkVisibility"] = "PUBLIC"
            }
        };

        var response = await _httpClient.PostAsync(
            "https://api.linkedin.com/v2/ugcPosts",
            new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("LinkedIn API error: {Error}", error);
            return PublishResult.Failure(error);
        }

        var result = await response.Content.ReadFromJsonAsync<LinkedInPostResponse>();
        return PublishResult.Success(
            result?.Id ?? "unknown",
            $"https://www.linkedin.com/feed/update/{result?.Id}"
        );
    }

    private async Task<string?> UploadImageAsync(string imageUrl, string author)
    {
        try
        {
            var registerBody = new
            {
                registerUploadRequest = new
                {
                    recipes = new[] { "urn:li:digitalmediaRecipe:feedshare-image" },
                    owner = author,
                    serviceRelationships = new[]
                    {
                        new
                        {
                            relationshipType = "OWNER",
                            identifier = "urn:li:userGeneratedContent"
                        }
                    }
                }
            };

            var registerResponse = await _httpClient.PostAsync(
                "https://api.linkedin.com/v2/assets?action=registerUpload",
                new StringContent(
                    JsonSerializer.Serialize(registerBody),
                    Encoding.UTF8,
                    "application/json"));

            if (!registerResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("LinkedIn image register failed");
                return null;
            }

            var registerResult = await registerResponse.Content.ReadFromJsonAsync<JsonElement>();

            var uploadUrl = registerResult
                .GetProperty("value")
                .GetProperty("uploadMechanism")
                .GetProperty("com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest")
                .GetProperty("uploadUrl")
                .GetString();

            var assetUrn = registerResult
                .GetProperty("value")
                .GetProperty("asset")
                .GetString();

            if (string.IsNullOrEmpty(uploadUrl) || string.IsNullOrEmpty(assetUrn))
                return null;

            using var downloadClient = new HttpClient();
            var imageBytes = await downloadClient.GetByteArrayAsync(imageUrl);

            var uploadResponse = await _httpClient.PutAsync(
                uploadUrl,
                new ByteArrayContent(imageBytes));

            if (!uploadResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("LinkedIn image upload failed");
                return null;
            }

            return assetUrn;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LinkedIn image upload threw an exception");
            return null;
        }
    }
}

public class LinkedInPostResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
}