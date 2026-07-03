using System.Net.Http.Json;
using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Publishing;
using AiContentFlow.Domain.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Publishers;

public class InstagramPublisher : IPublisher
{
    private const int MaxContainerStatusAttempts = 30;
    private static readonly TimeSpan ContainerStatusPollInterval = TimeSpan.FromSeconds(2);

    public SocialPlatform Platform => SocialPlatform.Instagram;

    private readonly HttpClient _httpClient;
    private readonly ILogger<InstagramPublisher> _logger;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly string _graphApiBaseUrl;
    private readonly string? _publicMediaBaseUrl;

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
        _publicMediaBaseUrl = configuration["App:PublicMediaBaseUrl"];
    }

    public async Task<PublishResult> PublishAsync(PostVariant post, SocialAccount account)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(account.ExternalAccountId))
                return PublishResult.Failure("Instagram business account ID is missing");

            if (string.IsNullOrEmpty(post.ContentJson))
                return PublishResult.Failure("PostVariant has no ContentJson");

            var (caption, imageUrl) = ContentJsonParser.Extract(post.ContentJson);
            if (string.IsNullOrWhiteSpace(caption))
                return PublishResult.Failure("Invalid ContentJson: 'text' is empty or missing");

            if (string.IsNullOrWhiteSpace(imageUrl))
                return PublishResult.Failure("Instagram publishing requires an image. Add an image before publishing.");

            var accessToken = await _credentialStore.GetAccessTokenAsync(account);
            var publishableImageUrl = await ResolvePublishableImageUrlAsync(accessToken, imageUrl);

            var creationId = await CreateMediaContainerAsync(
                account.ExternalAccountId,
                accessToken,
                publishableImageUrl,
                caption);

            await WaitForMediaContainerReadyAsync(creationId, accessToken);
            var publishId = await PublishMediaAsync(account.ExternalAccountId, accessToken, creationId);
            var postUrl = await TryGetPermalinkAsync(publishId, accessToken) ?? string.Empty;

            return PublishResult.Success(publishId, postUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram publish failed for account {AccountId}", account.Id);
            return PublishResult.Failure(ex.Message);
        }
    }

    private async Task<string> ResolvePublishableImageUrlAsync(string pageAccessToken, string imageUrl)
    {
        var rewritten = PublishLocalImageHelper.TryRewriteToPublicBaseUrl(imageUrl, _publicMediaBaseUrl);
        if (!string.IsNullOrWhiteSpace(rewritten))
        {
            _logger.LogInformation("Using public media base URL for Instagram image.");
            return rewritten;
        }

        if (PublishLocalImageHelper.TryResolveLocalPath(imageUrl, out var localPath))
        {
            _logger.LogInformation("Uploading local image via Facebook Page for Instagram publishing.");
            return await UploadLocalImageViaPageAsync(pageAccessToken, localPath);
        }

        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri)
            && (uri.IsLoopback
                || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("127.0.0.1")))
        {
            throw new InvalidOperationException(
                "Instagram cannot use localhost image URLs. Upload the image through the app or set App:PublicMediaBaseUrl to a publicly reachable API URL.");
        }

        return imageUrl;
    }

    private async Task<string> UploadLocalImageViaPageAsync(string pageAccessToken, string localPath)
    {
        var pageId = await GetPageIdFromTokenAsync(pageAccessToken);

        using var form = new MultipartFormDataContent
        {
            { new StringContent("false"), "published" },
            { new StringContent(pageAccessToken), "access_token" }
        };

        await using var stream = File.OpenRead(localPath);
        var imageContent = new StreamContent(stream);
        form.Add(imageContent, "source", Path.GetFileName(localPath));

        var uploadResponse = await _httpClient.PostAsync($"{_graphApiBaseUrl}/{pageId}/photos", form);
        var uploadBody = await uploadResponse.Content.ReadAsStringAsync();

        if (!uploadResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Facebook Page photo staging failed for Instagram: {Body}", uploadBody);
            throw new InvalidOperationException($"Failed to stage image for Instagram: {uploadBody}");
        }

        var uploadJson = JsonSerializer.Deserialize<JsonElement>(uploadBody);
        var photoId = uploadJson.TryGetProperty("id", out var idProp)
            ? idProp.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(photoId))
            throw new InvalidOperationException("Facebook Page photo staging returned no photo id");

        var imageUrl = await GetPhotoSourceUrlAsync(photoId, pageAccessToken);
        _logger.LogInformation("Staged local image for Instagram via Page {PageId}.", pageId);
        return imageUrl;
    }

    private async Task<string> GetPageIdFromTokenAsync(string pageAccessToken)
    {
        var response = await _httpClient.GetAsync(
            $"{_graphApiBaseUrl}/me?fields=id&access_token={Uri.EscapeDataString(pageAccessToken)}");

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Failed to resolve Facebook Page id: {body}");

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        var pageId = json.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;

        return string.IsNullOrWhiteSpace(pageId)
            ? throw new InvalidOperationException("Facebook Page id could not be resolved from the connected token")
            : pageId;
    }

    private async Task<string> GetPhotoSourceUrlAsync(string photoId, string pageAccessToken)
    {
        var response = await _httpClient.GetAsync(
            $"{_graphApiBaseUrl}/{photoId}?fields=images&access_token={Uri.EscapeDataString(pageAccessToken)}");

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Failed to read staged photo URL: {body}");

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        if (!json.TryGetProperty("images", out var imagesProp) || imagesProp.ValueKind != JsonValueKind.Array)
            throw new InvalidOperationException("Staged photo did not return image URLs");

        string? bestUrl = null;
        var bestWidth = -1;

        foreach (var image in imagesProp.EnumerateArray())
        {
            if (!image.TryGetProperty("source", out var sourceProp))
                continue;

            var source = sourceProp.GetString();
            var width = image.TryGetProperty("width", out var widthProp) ? widthProp.GetInt32() : 0;

            if (!string.IsNullOrWhiteSpace(source) && width >= bestWidth)
            {
                bestWidth = width;
                bestUrl = source;
            }
        }

        return string.IsNullOrWhiteSpace(bestUrl)
            ? throw new InvalidOperationException("Staged photo did not include a usable image URL")
            : bestUrl;
    }

    private async Task<string> CreateMediaContainerAsync(
        string igUserId,
        string accessToken,
        string imageUrl,
        string caption)
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

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Instagram media container creation failed: {Body}", body);
            throw new InvalidOperationException($"Instagram media creation failed: {body}");
        }

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        return json.TryGetProperty("id", out var idProp) && !string.IsNullOrWhiteSpace(idProp.GetString())
            ? idProp.GetString()!
            : throw new InvalidOperationException("Instagram media creation returned no id");
    }

    private async Task WaitForMediaContainerReadyAsync(string containerId, string accessToken)
    {
        for (var attempt = 1; attempt <= MaxContainerStatusAttempts; attempt++)
        {
            var response = await _httpClient.GetAsync(
                $"{_graphApiBaseUrl}/{containerId}?fields=status_code&access_token={Uri.EscapeDataString(accessToken)}");

            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Instagram container status check failed (attempt {Attempt}): {Body}",
                    attempt,
                    body);
            }
            else
            {
                var json = JsonSerializer.Deserialize<JsonElement>(body);
                var status = json.TryGetProperty("status_code", out var statusProp)
                    ? statusProp.GetString()
                    : null;

                if (string.Equals(status, "FINISHED", StringComparison.OrdinalIgnoreCase))
                    return;

                if (string.Equals(status, "ERROR", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(status, "EXPIRED", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"Instagram media container failed with status {status}: {body}");
                }
            }

            await Task.Delay(ContainerStatusPollInterval);
        }

        throw new InvalidOperationException(
            "Instagram media container did not become ready in time. Try again in a few minutes.");
    }

    private async Task<string?> TryGetPermalinkAsync(string mediaId, string accessToken)
    {
        var response = await _httpClient.GetAsync(
            $"{_graphApiBaseUrl}/{mediaId}?fields=permalink&access_token={Uri.EscapeDataString(accessToken)}");

        if (!response.IsSuccessStatusCode)
            return null;

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        return json.TryGetProperty("permalink", out var permalinkProp)
            ? permalinkProp.GetString()
            : null;
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

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Instagram media_publish failed: {Body}", body);
            throw new InvalidOperationException($"Instagram publish failed: {body}");
        }

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        return json.TryGetProperty("id", out var idProp) && !string.IsNullOrWhiteSpace(idProp.GetString())
            ? idProp.GetString()!
            : throw new InvalidOperationException("Instagram publish returned no id");
    }
}
