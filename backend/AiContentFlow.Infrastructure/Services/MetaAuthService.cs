using System.Text;
using System.Text.Json;
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
            var oauthPlatform = TryGetPlatformFromState(state) ?? "facebook";
            var credentials = ResolveCredentials(oauthPlatform);

            var scope =
                "public_profile,email," +
                "pages_show_list,pages_manage_posts,pages_read_engagement," +
                "instagram_basic,instagram_content_publish";

            return $"{_oAuthUrl}?" +
                   $"client_id={credentials.AppId}" +
                   $"&redirect_uri={Uri.EscapeDataString(credentials.RedirectUri)}" +
                   $"&scope={scope}" +
                   $"&state={state}" +
                   $"&response_type=code";
        }

        public async Task<SocialAuthResult> ProcessCallbackAsync(string code, string state)
        {
            if (string.IsNullOrWhiteSpace(state))
                throw new Exception("Invalid state parameter");

            var oauthPlatform = TryGetPlatformFromState(state) ?? "facebook";
            var credentials = ResolveCredentials(oauthPlatform);

            _logger.LogInformation("Exchanging code for short-lived token.");
            var shortLivedToken = await ExchangeCodeAsync(code, credentials);
            _logger.LogInformation("Short-lived token obtained.");
            _logger.LogInformation("Exchanging short-lived token for long-lived token.");
            var longLivedToken = await ExchangeForLongLivedTokenAsync(shortLivedToken, credentials);
            _logger.LogInformation("Long-lived token obtained.");
            _logger.LogInformation("Fetching pages using long-lived token.");
            var pages = await GetPagesAsync(longLivedToken.AccessToken);
            _logger.LogInformation("Fetched {PageCount} Facebook page(s) from Meta.", pages.Count);
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

                if (!string.IsNullOrWhiteSpace(page.InstagramBusinessAccountId))
                {
                    accounts.Add(BuildInstagramAccount(page, facebookHandle, tokenExpiry));
                }
            }

            if (string.Equals(oauthPlatform, "instagram", StringComparison.OrdinalIgnoreCase)
                && !accounts.Any(account => account.Platform.Equals("Instagram", StringComparison.OrdinalIgnoreCase)))
            {
                throw BuildInstagramDiscoveryException(pages);
            }

            return new SocialAuthResult(accounts);
        }

        private static SocialAccountAuthDto BuildInstagramAccount(MetaPage page, string facebookHandle, DateTime tokenExpiry)
        {
            var igUsername = page.InstagramBusinessAccount?.Username?.Trim();
            var igHandle = FormatInstagramHandle(igUsername, facebookHandle);
            var igDisplayName = !string.IsNullOrWhiteSpace(igUsername)
                ? igUsername
                : $"{page.Name} Instagram";

            return new SocialAccountAuthDto(
                "Instagram",
                page.InstagramBusinessAccountId!,
                igDisplayName,
                igHandle,
                page.Name,
                page.AccessToken,
                tokenExpiry,
                null);
        }

        private static InvalidOperationException BuildInstagramDiscoveryException(IReadOnlyList<MetaPage> pages)
        {
            if (pages.Count == 0)
            {
                return new InvalidOperationException(
                    "Meta returned no Facebook Pages for this login. During Facebook login, grant access to your Page. " +
                    "If the Page is managed in Meta Business Suite, your app also needs the business_management permission " +
                    "(enable it for your app and reconnect).");
            }

            var pageNames = string.Join(", ", pages.Select(page => page.Name));
            return new InvalidOperationException(
                $"Meta returned {pages.Count} Facebook Page(s) ({pageNames}) but none have a linked Instagram Professional account. " +
                "Open the Page in Meta Business Suite → Settings → Linked accounts and connect Instagram as Business or Creator, then try again.");
        }

        private async Task<string> ExchangeCodeAsync(string code, MetaOAuthCredentials credentials)
        {
            var appId = credentials.AppId;
            var appSecret = credentials.AppSecret;
            var redirectUri = credentials.RedirectUri;

            var response = await _httpClient.GetAsync(
                $"{_graphApiBase}oauth/access_token?" +
                $"client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&code={code}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}");

            var result = await response.Content.ReadFromJsonAsync<TokenResponse>();
            return result?.AccessToken ?? throw new Exception("Failed to exchange code");
        }

        private async Task<LongLivedTokenResponse> ExchangeForLongLivedTokenAsync(string shortLivedToken, MetaOAuthCredentials credentials)
        {
            var appId = credentials.AppId;
            var appSecret = credentials.AppSecret;

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
                $"{_graphApiBase}me/accounts?fields=id,name,access_token,instagram_business_account{{id,username}}");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", userToken);

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Meta me/accounts failed ({StatusCode}): {Body}", response.StatusCode, responseBody);
                throw new InvalidOperationException("Failed to load Facebook Pages from Meta. Check app permissions and try again.");
            }

            var result = JsonSerializer.Deserialize<PagesResponse>(responseBody);
            var pages = result?.Data ?? new List<MetaPage>();

            if (pages.Count == 0)
            {
                _logger.LogWarning("Meta me/accounts returned no pages. Response: {Body}", responseBody);
                return pages;
            }

            foreach (var page in pages)
            {
                if (!string.IsNullOrWhiteSpace(page.InstagramBusinessAccountId)
                    || string.IsNullOrWhiteSpace(page.AccessToken))
                {
                    continue;
                }

                var instagramAccount = await FetchInstagramBusinessAccountForPageAsync(page.Id, page.AccessToken);
                if (instagramAccount != null)
                {
                    page.InstagramBusinessAccount = instagramAccount;
                    _logger.LogInformation(
                        "Resolved Instagram business account for page {PageName} via page token.",
                        page.Name);
                }
            }

            return pages;
        }

        private async Task<MetaInstagramAccount?> FetchInstagramBusinessAccountForPageAsync(string pageId, string pageAccessToken)
        {
            var url =
                $"{_graphApiBase}{pageId}?fields=instagram_business_account{{id,username}}&access_token={Uri.EscapeDataString(pageAccessToken)}";

            var response = await _httpClient.GetAsync(url);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Meta page Instagram lookup failed for page {PageId} ({StatusCode}): {Body}",
                    pageId,
                    response.StatusCode,
                    responseBody);
                return null;
            }

            var pageDetails = JsonSerializer.Deserialize<MetaPageDetailsResponse>(responseBody);
            return pageDetails?.InstagramBusinessAccount;
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

        private MetaOAuthCredentials ResolveCredentials(string oauthPlatform)
        {
            // Instagram publishing and OAuth both go through the same Meta (Facebook) app.
            if (string.Equals(oauthPlatform, "instagram", StringComparison.OrdinalIgnoreCase))
            {
                var redirectUri = RequireSetting("Instagram:RedirectUri");
                _logger.LogInformation(
                    "Starting Instagram OAuth with Meta app {AppIdSuffix}. Redirect URI: {RedirectUri}",
                    AppIdSuffix(RequireSetting("Meta:AppId")),
                    redirectUri);

                return new MetaOAuthCredentials(
                    RequireSetting("Meta:AppId"),
                    RequireSetting("Meta:AppSecret"),
                    redirectUri);
            }

            return new MetaOAuthCredentials(
                RequireSetting("Meta:AppId"),
                RequireSetting("Meta:AppSecret"),
                RequireSetting("Meta:RedirectUri"));
        }

        private static string AppIdSuffix(string appId)
            => appId.Length >= 4 ? $"…{appId[^4..]}" : "…";

        private static string? TryGetPlatformFromState(string state)
        {
            try
            {
                var parts = state.Split('.');
                if (parts.Length != 2)
                    return null;

                var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[0]));
                using var document = JsonDocument.Parse(payloadJson);
                if (document.RootElement.TryGetProperty("Platform", out var platformElement))
                    return platformElement.GetString();
            }
            catch
            {
                return null;
            }

            return null;
        }

        private static string FormatInstagramHandle(string? username, string pageName)
        {
            if (!string.IsNullOrWhiteSpace(username))
            {
                var trimmed = username.Trim();
                return trimmed.StartsWith('@') ? trimmed : $"@{trimmed}";
            }

            return $"{pageName.Trim()}-ig";
        }

        private static byte[] Base64UrlDecode(string value)
        {
            var padded = value.Replace('-', '+').Replace('_', '/');
            padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
            return Convert.FromBase64String(padded);
        }

        private string RequireSetting(string key)
        {
            var value = _config[key]?.Trim();
            if (string.IsNullOrWhiteSpace(value)
                || value.StartsWith("__SET_IN", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Missing required Meta configuration key: {key}. Set it in backend/.env or environment variables.");
            }

            return value;
        }

        private sealed record MetaOAuthCredentials(string AppId, string AppSecret, string RedirectUri);
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

    public class MetaPageDetailsResponse
    {
        [JsonPropertyName("instagram_business_account")] public MetaInstagramAccount? InstagramBusinessAccount { get; set; }
    }

    public class MetaPage
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
        [JsonPropertyName("instagram_business_account")] public MetaInstagramAccount? InstagramBusinessAccount { get; set; }
        public string? InstagramBusinessAccountId => InstagramBusinessAccount?.Id;
    }

    public class MetaInstagramAccount
    {
        [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
        [JsonPropertyName("username")] public string Username { get; set; } = string.Empty;
    }
}