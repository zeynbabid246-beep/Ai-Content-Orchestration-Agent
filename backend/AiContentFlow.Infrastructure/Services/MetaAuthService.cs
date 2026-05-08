using AiContentFlow.Application.Common.Models;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Infrastructure.Services
{
    public class MetaAuthService : ISocialAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<MetaAuthService> _logger;
        private readonly string _graphApiBase;
        private readonly string _oAuthUrl;

        public MetaAuthService(
            IHttpClientFactory factory,
            IConfiguration config,
            ILogger<MetaAuthService> logger)
        {
            _httpClient = factory.CreateClient();
            _config = config;
            _logger = logger;
            var graphVersion = _config["Meta:GraphApiVersion"] ?? "v22.0";
            _graphApiBase = $"https://graph.facebook.com/{graphVersion}/";
            _oAuthUrl = $"https://www.facebook.com/{graphVersion}/dialog/oauth";
        }

        public string GetAuthUrl(string state)
        {
            var appId = _config["Meta:AppId"]!;
            var redirectUri = _config["Meta:RedirectUri"]!;

            var scope = "pages_show_list,pages_manage_posts,pages_read_engagement,public_profile";

            return $"{_oAuthUrl}?" +
                   $"client_id={appId}" +
                   $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                   $"&scope={scope}" +
                   $"&state={state}" +
                   $"&response_type=code";
        }

        public async Task<SocialAuthResult> ProcessCallbackAsync(string code, string state)
        {
            if (string.IsNullOrWhiteSpace(state))
                throw new Exception("Invalid state parameter");

            _logger.LogInformation("Exchanging code for short-lived token.");
            var shortLivedToken = await ExchangeCodeAsync(code);
            _logger.LogInformation("Short-lived token obtained.");
            _logger.LogInformation("Exchanging short-lived token for long-lived token.");
            var longLivedToken = await ExchangeForLongLivedTokenAsync(shortLivedToken);
            _logger.LogInformation("Long-lived token obtained.");
            _logger.LogInformation("Fetching pages using long-lived token.");
            var pages = await GetPagesAsync(longLivedToken.AccessToken);
            _logger.LogInformation("Pages fetched successfully.");
            var tokenExpiry = ResolveFacebookTokenExpiry(longLivedToken.ExpiresIn);

            var accounts = new List<SocialAccountAuthDto>();

            foreach (var page in pages)
            {
                var facebookHandle = page.Name.Trim();
                accounts.Add(new SocialAccountAuthDto(
                    "Facebook",
                    page.Id,
                    page.Name,
                    facebookHandle,
                    page.Name,
                    page.AccessToken,
                    tokenExpiry,
                    null));

            }

            return new SocialAuthResult(accounts);
        }

        private async Task<string> ExchangeCodeAsync(string code)
        {
            var appId = _config["Meta:AppId"]!;
            var appSecret = _config["Meta:AppSecret"]!;
            var redirectUri = _config["Meta:RedirectUri"]!;

            var response = await _httpClient.GetAsync(
                $"{_graphApiBase}oauth/access_token?" +
                $"client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&code={code}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}");

            var result = await response.Content.ReadFromJsonAsync<TokenResponse>();
            return result?.AccessToken ?? throw new Exception("Failed to exchange code");
        }

        private async Task<LongLivedTokenResponse> ExchangeForLongLivedTokenAsync(string shortLivedToken)
        {
            var appId = _config["Meta:AppId"]!;
            var appSecret = _config["Meta:AppSecret"]!;

            var response = await _httpClient.GetAsync(
                $"{_graphApiBase}oauth/access_token?" +
                $"grant_type=fb_exchange_token" +
                $"&client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&fb_exchange_token={shortLivedToken}");

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Meta long-lived token exchange failed: {Error}", error);
                throw new Exception("Failed to exchange for long-lived token");
            }

            var result = await response.Content.ReadFromJsonAsync<LongLivedTokenResponse>();
            return result ?? throw new Exception("Failed to exchange for long-lived token");
        }

        private async Task<List<MetaPage>> GetPagesAsync(string userToken)
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"{_graphApiBase}me/accounts?fields=id,name,access_token");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", userToken);

            var response = await _httpClient.SendAsync(request);

            var result = await response.Content.ReadFromJsonAsync<PagesResponse>();
            return result?.Data ?? new List<MetaPage>();
        }

        private static DateTime ResolveFacebookTokenExpiry(int expiresInSeconds)
        {
            // Facebook page tokens may return 0/empty expiry depending on the app/account setup.
            // Treat them as long-lived to avoid false immediate-expired states in publication checks.
            if (expiresInSeconds <= 0)
            {
                return DateTime.UtcNow.AddYears(1);
            }

            return DateTime.UtcNow.AddSeconds(expiresInSeconds);
        }
    }

    public class TokenResponse
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
    }

    public class LongLivedTokenResponse
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
        [JsonPropertyName("expires_in")] public int ExpiresIn { get; set; }
        [JsonPropertyName("token_type")] public string TokenType { get; set; } = string.Empty;
    }

    public class PagesResponse
    {
        [JsonPropertyName("data")] public List<MetaPage> Data { get; set; } = new();
    }

    public class MetaPage
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
    }
}