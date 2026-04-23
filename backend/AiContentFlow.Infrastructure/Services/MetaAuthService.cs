using AiContentFlow.Infrastructure.Persistence;
using Application.Interfaces;
using AiContentFlow.Domain.Models;
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
        private readonly AppDbContext _db;
        private readonly ILogger<MetaAuthService> _logger;

        private const string GraphApiBase = "https://graph.facebook.com/v18.0/";
        private const string OAuthUrl = "https://www.facebook.com/v18.0/dialog/oauth";

        public MetaAuthService(
            IHttpClientFactory factory,
            IConfiguration config,
            AppDbContext db,
            ILogger<MetaAuthService> logger)
        {
            _httpClient = factory.CreateClient();
            _config = config;
            _db = db;
            _logger = logger;
        }

        public string GetAuthUrl(int channelId)
{
    var appId = _config["Meta:AppId"]!;
    var redirectUri = _config["Meta:RedirectUri"]!;
    var state = $"{channelId}:{Guid.NewGuid()}";

    var scope = "email,public_profile";

    return $"{OAuthUrl}?" +
           $"client_id={appId}" +
           $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
           $"&scope={scope}" +
           $"&state={state}" +
           $"&response_type=code";
}

        public async Task ProcessCallbackAsync(string code, string state)
        {
            var channelId = int.Parse(state.Split(':')[0]);

            var userToken = await ExchangeCodeAsync(code);
            var pages = await GetPagesAsync(userToken);

            foreach (var page in pages)
            {
                var fbAccount = new SocialAccount
                {
                    ChannelId = channelId,
                    Platform = SocialPlatform.Facebook,
                    AccountName = page.Name,
                    OAuthToken = page.AccessToken,
                    RefreshToken = null,
                    TokenExpiry = DateTime.UtcNow.AddYears(1),
                    IsActive = true
                };
                _db.SocialAccounts.Add(fbAccount);

                if (page.InstagramBusinessAccount != null)
                {
                    var igAccount = new SocialAccount
                    {
                        ChannelId = channelId,
                        Platform = SocialPlatform.Instagram,
                        AccountName = page.InstagramBusinessAccount.Id,
                        OAuthToken = page.AccessToken,
                        RefreshToken = null,
                        TokenExpiry = DateTime.UtcNow.AddYears(1),
                        IsActive = true
                    };
                    _db.SocialAccounts.Add(igAccount);
                }
            }

            await _db.SaveChangesAsync();
        }

        private async Task<string> ExchangeCodeAsync(string code)
        {
            var appId = _config["Meta:AppId"]!;
            var appSecret = _config["Meta:AppSecret"]!;
            var redirectUri = _config["Meta:RedirectUri"]!;

            var response = await _httpClient.GetAsync(
                $"{GraphApiBase}oauth/access_token?" +
                $"client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&code={code}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}");

            var result = await response.Content.ReadFromJsonAsync<TokenResponse>();
            return result?.AccessToken ?? throw new Exception("Failed to exchange code");
        }

        private async Task<List<MetaPage>> GetPagesAsync(string userToken)
        {
            var response = await _httpClient.GetAsync(
                $"{GraphApiBase}me/accounts?" +
                $"access_token={userToken}" +
                $"&fields=id,name,access_token,instagram_business_account");

            var result = await response.Content.ReadFromJsonAsync<PagesResponse>();
            return result?.Data ?? new List<MetaPage>();
        }
    }

    public class TokenResponse
    {
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
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
        [JsonPropertyName("instagram_business_account")] public InstagramBusinessAccount? InstagramBusinessAccount { get; set; }
    }

    public class InstagramBusinessAccount
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    }
}