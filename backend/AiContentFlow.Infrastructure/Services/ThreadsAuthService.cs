using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiContentFlow.Application.Common.Models;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Services;

public class ThreadsAuthService : ISocialAuthService
{
    private const string OAuthAuthorizeUrl = "https://threads.net/oauth/authorize";
    private const string OAuthTokenUrl = "https://graph.threads.net/oauth/access_token";
    private const string LongLivedTokenUrl = "https://graph.threads.net/access_token";
    private const string GraphApiBaseUrl = "https://graph.threads.net/v1.0";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ThreadsAuthService> _logger;

    public ThreadsAuthService(
        IHttpClientFactory factory,
        IConfiguration config,
        ILogger<ThreadsAuthService> logger)
    {
        _httpClient = factory.CreateClient("Threads");
        _config = config;
        _logger = logger;
    }

    public string GetAuthUrl(string state)
    {
        var appId = RequireSetting("Threads:AppId");
        var redirectUri = RequireSetting("Threads:RedirectUri");
        const string scope = "threads_basic,threads_content_publish";

        _logger.LogInformation(
            "Starting Threads OAuth with redirect URI: {RedirectUri}. " +
            "This exact URL must be saved under Meta → Use cases → Threads API → Settings.",
            redirectUri);

        return $"{OAuthAuthorizeUrl}?" +
               $"client_id={Uri.EscapeDataString(appId)}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&scope={Uri.EscapeDataString(scope)}" +
               $"&response_type=code" +
               $"&state={Uri.EscapeDataString(state)}";
    }

    public async Task<SocialAuthResult> ProcessCallbackAsync(string code, string state)
    {
        if (string.IsNullOrWhiteSpace(state))
            throw new InvalidOperationException("Invalid state parameter");

        _logger.LogInformation("Exchanging Threads authorization code for short-lived token.");
        var shortLivedToken = await ExchangeCodeAsync(code);
        _logger.LogInformation("Exchanging short-lived Threads token for long-lived token.");
        var longLivedToken = await ExchangeForLongLivedTokenAsync(shortLivedToken);
        _logger.LogInformation("Fetching Threads profile.");
        var profile = await GetProfileAsync(longLivedToken.AccessToken);

        var handle = FormatHandle(profile.Username);
        var displayName = string.IsNullOrWhiteSpace(profile.Name) ? handle : profile.Name.Trim();
        var tokenExpiry = DateTime.UtcNow.AddSeconds(longLivedToken.ExpiresIn > 0 ? longLivedToken.ExpiresIn : 5184000);

        var accounts = new List<SocialAccountAuthDto>
        {
            new(
                "Threads",
                profile.Id,
                displayName,
                handle,
                displayName,
                longLivedToken.AccessToken,
                tokenExpiry,
                null)
        };

        return new SocialAuthResult(accounts);
    }

    private async Task<string> ExchangeCodeAsync(string code)
    {
        var appId = RequireSetting("Threads:AppId");
        var appSecret = RequireSetting("Threads:AppSecret");
        var redirectUri = RequireSetting("Threads:RedirectUri");

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = appId,
            ["client_secret"] = appSecret,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = redirectUri,
            ["code"] = code
        });

        var response = await _httpClient.PostAsync(OAuthTokenUrl, content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Threads token exchange failed ({StatusCode}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException("Failed to exchange Threads authorization code.");
        }

        var result = JsonSerializer.Deserialize<ThreadsTokenResponse>(body);
        return string.IsNullOrWhiteSpace(result?.AccessToken)
            ? throw new InvalidOperationException("Threads token exchange returned no access token.")
            : result.AccessToken;
    }

    private async Task<ThreadsTokenResponse> ExchangeForLongLivedTokenAsync(string shortLivedToken)
    {
        var appSecret = RequireSetting("Threads:AppSecret");
        var url =
            $"{LongLivedTokenUrl}?grant_type=th_exchange_token" +
            $"&client_secret={Uri.EscapeDataString(appSecret)}" +
            $"&access_token={Uri.EscapeDataString(shortLivedToken)}";

        var response = await _httpClient.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Threads long-lived token exchange failed ({StatusCode}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException("Failed to exchange for long-lived Threads token.");
        }

        return JsonSerializer.Deserialize<ThreadsTokenResponse>(body)
               ?? throw new InvalidOperationException("Failed to exchange for long-lived Threads token.");
    }

    private async Task<ThreadsProfile> GetProfileAsync(string accessToken)
    {
        var response = await _httpClient.GetAsync(
            $"{GraphApiBaseUrl}/me?fields=id,username,name&access_token={Uri.EscapeDataString(accessToken)}");

        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Threads profile lookup failed ({StatusCode}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException("Failed to load Threads profile from Meta.");
        }

        var profile = JsonSerializer.Deserialize<ThreadsProfile>(body);
        if (profile == null || string.IsNullOrWhiteSpace(profile.Id))
            throw new InvalidOperationException("Threads profile response did not include a user id.");

        return profile;
    }

    private static string FormatHandle(string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return "@threads-user";

        var trimmed = username.Trim().TrimStart('@');
        return $"@{trimmed}";
    }

    private string RequireSetting(string key)
    {
        var value = _config[key]?.Trim();
        if (string.IsNullOrWhiteSpace(value)
            || value.StartsWith("__SET_IN", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Missing required Threads configuration key: {key}. Set it in backend/.env or environment variables.");
        }

        if (key == "Threads:RedirectUri"
            && value.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Threads:RedirectUri must use HTTPS. Meta blocks HTTP redirect URIs (error 1349187). " +
                "Use https://localhost:7075/api/auth/threads/callback for local dev.");
        }

        return value;
    }

    private sealed class ThreadsTokenResponse
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
        [JsonPropertyName("expires_in")] public int ExpiresIn { get; set; }
    }

    private sealed class ThreadsProfile
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("username")] public string Username { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    }
}
