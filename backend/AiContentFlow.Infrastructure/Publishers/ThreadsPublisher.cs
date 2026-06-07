using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Publishers;

public class ThreadsPublisher : IPublisher
{
    private const int MaxContainerStatusAttempts = 30;
    private static readonly TimeSpan ContainerStatusPollInterval = TimeSpan.FromSeconds(2);
    private const string GraphApiBaseUrl = "https://graph.threads.net/v1.0";

    public SocialPlatform Platform => SocialPlatform.Threads;

    private readonly HttpClient _httpClient;
    private readonly ILogger<ThreadsPublisher> _logger;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly string? _publicMediaBaseUrl;

    public ThreadsPublisher(
        IHttpClientFactory factory,
        ILogger<ThreadsPublisher> logger,
        ISocialCredentialStore credentialStore,
        IConfiguration configuration)
    {
        _httpClient = factory.CreateClient("Threads");
        _logger = logger;
        _credentialStore = credentialStore;
        _publicMediaBaseUrl = configuration["App:PublicMediaBaseUrl"];
    }

    public async Task<PublishResult> PublishAsync(PostVariant post, SocialAccount account)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(account.ExternalAccountId))
                return PublishResult.Failure("Threads user ID is missing");

            if (string.IsNullOrEmpty(post.ContentJson))
                return PublishResult.Failure("PostVariant has no ContentJson");

            var content = JsonSerializer.Deserialize<JsonElement>(post.ContentJson);
            if (!content.TryGetProperty("text", out var textProp))
                return PublishResult.Failure("Invalid ContentJson: missing 'text' field");

            var text = textProp.GetString() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(text))
                return PublishResult.Failure("Invalid ContentJson: 'text' is empty");

            string? imageUrl = null;
            if (content.TryGetProperty("imageUrl", out var imageProp))
                imageUrl = imageProp.GetString();

            var accessToken = await _credentialStore.GetAccessTokenAsync(account);
            var creationId = string.IsNullOrWhiteSpace(imageUrl)
                ? await CreateTextContainerAsync(account.ExternalAccountId, accessToken, text)
                : await CreateImageContainerAsync(
                    account.ExternalAccountId,
                    accessToken,
                    text,
                    ResolvePublishableImageUrl(imageUrl));

            await WaitForContainerReadyAsync(creationId, accessToken);
            var publishId = await PublishContainerAsync(account.ExternalAccountId, accessToken, creationId);
            var postUrl = await TryGetPermalinkAsync(publishId, accessToken) ?? string.Empty;

            return PublishResult.Success(publishId, postUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Threads publish failed for account {AccountId}", account.Id);
            return PublishResult.Failure(ex.Message);
        }
    }

    private string ResolvePublishableImageUrl(string imageUrl)
    {
        var rewritten = PublishLocalImageHelper.TryRewriteToPublicBaseUrl(imageUrl, _publicMediaBaseUrl);
        if (!string.IsNullOrWhiteSpace(rewritten))
        {
            _logger.LogInformation("Using public media base URL for Threads image.");
            return rewritten;
        }

        if (PublishLocalImageHelper.TryResolveLocalPath(imageUrl, out _))
        {
            throw new InvalidOperationException(
                "Threads cannot use localhost image URLs. Set App:PublicMediaBaseUrl to a publicly reachable API URL or use a hosted image URL.");
        }

        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri)
            && (uri.IsLoopback
                || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("127.0.0.1")))
        {
            throw new InvalidOperationException(
                "Threads cannot use localhost image URLs. Set App:PublicMediaBaseUrl to a publicly reachable API URL.");
        }

        return imageUrl;
    }

    private async Task<string> CreateTextContainerAsync(string threadsUserId, string accessToken, string text)
    {
        var payload = new Dictionary<string, string>
        {
            ["media_type"] = "TEXT",
            ["text"] = text,
            ["access_token"] = accessToken
        };

        return await CreateContainerAsync(threadsUserId, payload);
    }

    private async Task<string> CreateImageContainerAsync(
        string threadsUserId,
        string accessToken,
        string text,
        string imageUrl)
    {
        var payload = new Dictionary<string, string>
        {
            ["media_type"] = "IMAGE",
            ["image_url"] = imageUrl,
            ["text"] = text,
            ["access_token"] = accessToken
        };

        return await CreateContainerAsync(threadsUserId, payload);
    }

    private async Task<string> CreateContainerAsync(string threadsUserId, Dictionary<string, string> payload)
    {
        var response = await _httpClient.PostAsync(
            $"{GraphApiBaseUrl}/{threadsUserId}/threads",
            new FormUrlEncodedContent(payload));

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Threads media container creation failed: {Body}", body);
            throw new InvalidOperationException($"Threads media creation failed: {body}");
        }

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        return json.TryGetProperty("id", out var idProp) && !string.IsNullOrWhiteSpace(idProp.GetString())
            ? idProp.GetString()!
            : throw new InvalidOperationException("Threads media creation returned no id");
    }

    private async Task WaitForContainerReadyAsync(string containerId, string accessToken)
    {
        for (var attempt = 1; attempt <= MaxContainerStatusAttempts; attempt++)
        {
            var response = await _httpClient.GetAsync(
                $"{GraphApiBaseUrl}/{containerId}?fields=status&access_token={Uri.EscapeDataString(accessToken)}");

            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Threads container status check failed (attempt {Attempt}): {Body}",
                    attempt,
                    body);
            }
            else
            {
                var json = JsonSerializer.Deserialize<JsonElement>(body);
                var status = json.TryGetProperty("status", out var statusProp)
                    ? statusProp.GetString()
                    : null;

                if (string.Equals(status, "FINISHED", StringComparison.OrdinalIgnoreCase))
                    return;

                if (string.Equals(status, "ERROR", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(status, "EXPIRED", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException($"Threads media container failed with status {status}: {body}");
                }
            }

            await Task.Delay(ContainerStatusPollInterval);
        }

        throw new InvalidOperationException(
            "Threads media container did not become ready in time. Try again in a few minutes.");
    }

    private async Task<string> PublishContainerAsync(string threadsUserId, string accessToken, string creationId)
    {
        var payload = new Dictionary<string, string>
        {
            ["creation_id"] = creationId,
            ["access_token"] = accessToken
        };

        var response = await _httpClient.PostAsync(
            $"{GraphApiBaseUrl}/{threadsUserId}/threads_publish",
            new FormUrlEncodedContent(payload));

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Threads threads_publish failed: {Body}", body);
            throw new InvalidOperationException($"Threads publish failed: {body}");
        }

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        return json.TryGetProperty("id", out var idProp) && !string.IsNullOrWhiteSpace(idProp.GetString())
            ? idProp.GetString()!
            : throw new InvalidOperationException("Threads publish returned no id");
    }

    private async Task<string?> TryGetPermalinkAsync(string mediaId, string accessToken)
    {
        var response = await _httpClient.GetAsync(
            $"{GraphApiBaseUrl}/{mediaId}?fields=permalink&access_token={Uri.EscapeDataString(accessToken)}");

        if (!response.IsSuccessStatusCode)
            return null;

        var body = await response.Content.ReadAsStringAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        return json.TryGetProperty("permalink", out var permalinkProp)
            ? permalinkProp.GetString()
            : null;
    }
}
