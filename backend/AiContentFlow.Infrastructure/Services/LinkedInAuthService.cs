using System.Net.Http.Json;
using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.Services;

public class LinkedInAuthService : ILinkedInAuthService, ISocialAuthService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;
    private readonly ILogger<LinkedInAuthService> _logger;

    public LinkedInAuthService(
        IConfiguration config,
        AppDbContext db,
        ILogger<LinkedInAuthService> logger)
    {
        _config = config;
        _db = db;
        _logger = logger;
    }

    public string GetLoginUrl(string state)
    {
        var clientId = _config["LinkedIn:ClientId"]!;
        var redirectUri = _config["LinkedIn:RedirectUri"]!;

        return $"https://www.linkedin.com/oauth/v2/authorization?" +
               $"response_type=code" +
               $"&client_id={clientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&state={state}" +
               $"&scope=w_member_social%20openid%20profile%20email";
    }

    public async Task<SocialAuthResult> HandleCallbackAsync(string code, string state)
    {
        if (string.IsNullOrWhiteSpace(state))
            throw new Exception("Invalid state parameter");

        var (token, sub) = await ExchangeCodeAsync(code);
        _logger.LogInformation("OAuth sub from JWT: {Sub}", sub);

        var memberId = await GetMemberIdAsync(token, sub);
        _logger.LogInformation("Resolved member ID: {MemberId}", memberId);

        var name = await GetNameAsync(token);

       
        var accounts = new List<SocialAccountAuthDto>
        {
            new(
                "LinkedIn",
                memberId,
                name,
                name,
                name,
                token,
                DateTime.UtcNow.AddDays(60),
                null)
        };

        return new SocialAuthResult(accounts);
    }

    private async Task<string> GetMemberIdAsync(string accessToken, string fallbackSub)
    {
        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            var introspectContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("token", accessToken),
                new KeyValuePair<string, string>("client_id", _config["LinkedIn:ClientId"]!),
                new KeyValuePair<string, string>("client_secret", _config["LinkedIn:ClientSecret"]!)
            });

            var response = await client.PostAsync(
                "https://www.linkedin.com/oauth/v2/introspectToken", introspectContent);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                _logger.LogDebug("LinkedIn introspection result: {Result}", result);

                if (result.TryGetProperty("member_id", out var memberIdProp))
                    return memberIdProp.GetString() ?? fallbackSub;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LinkedIn introspection failed, using sub as fallback");
        }

        return fallbackSub;
    }

    private async Task<string> GetNameAsync(string accessToken)
    {
        try
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            var response = await client.GetAsync("https://api.linkedin.com/v2/userinfo");
            if (response.IsSuccessStatusCode)
            {
                var profile = await response.Content.ReadFromJsonAsync<JsonElement>();

                if (profile.TryGetProperty("name", out var name))
                    return name.GetString() ?? "LinkedIn User";

                if (profile.TryGetProperty("given_name", out var givenName))
                    return givenName.GetString() ?? "LinkedIn User";
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch LinkedIn profile name");
        }

        return "LinkedIn User";
    }

    private async Task<(string Token, string Sub)> ExchangeCodeAsync(string code)
    {
        using var client = new HttpClient();
        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("client_id", _config["LinkedIn:ClientId"]!),
            new KeyValuePair<string, string>("client_secret", _config["LinkedIn:ClientSecret"]!),
            new KeyValuePair<string, string>("redirect_uri", _config["LinkedIn:RedirectUri"]!)
        });

        var response = await client.PostAsync(
            "https://www.linkedin.com/oauth/v2/accessToken", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"LinkedIn token exchange failed: {error}");
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        _logger.LogDebug("LinkedIn token response received");

        var accessToken = result.GetProperty("access_token").GetString()!;

        var idToken = result.GetProperty("id_token").GetString()!;
        var payload = idToken.Split('.')[1];
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payload));

        var claims = JsonSerializer.Deserialize<JsonElement>(json);
        var sub = claims.GetProperty("sub").GetString()!;

        return (accessToken, sub);
    }

    public string GetAuthUrl(string state) => GetLoginUrl(state);
    public Task<SocialAuthResult> ProcessCallbackAsync(string code, string state) => HandleCallbackAsync(code, state);
}