using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using Microsoft.Extensions.Configuration;

namespace AiContentFlow.Infrastructure.Services;

public class SignedSocialAuthStateService : ISocialAuthStateService
{
    private static readonly TimeSpan StateLifetime = TimeSpan.FromMinutes(10);
    private readonly byte[] _secret;

    public SignedSocialAuthStateService(IConfiguration configuration)
    {
        var secret = configuration["SocialAuth:StateSecret"] ?? configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Social auth state signing secret is not configured");

        _secret = Encoding.UTF8.GetBytes(secret);
    }

    public string CreateState(Guid teamId, int channelId, string userId, string platform, DateTime utcNow)
    {
        var payload = new SocialAuthStatePayload(
            teamId,
            channelId,
            userId,
            NormalizePlatform(platform),
            Guid.NewGuid().ToString("N"),
            utcNow.Add(StateLifetime));

        var payloadJson = JsonSerializer.Serialize(payload);
        var payloadToken = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));
        var signature = Sign(payloadToken);
        return $"{payloadToken}.{signature}";
    }

    public SocialAuthState ValidateState(string state, string platform, DateTime utcNow, string? expectedUserId = null)
    {
        var parts = state.Split('.');
        if (parts.Length != 2)
            throw new InvalidOperationException("Invalid OAuth state");

        var expectedSignature = Sign(parts[0]);
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedSignature),
                Encoding.UTF8.GetBytes(parts[1])))
            throw new InvalidOperationException("Invalid OAuth state signature");

        var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[0]));
        var payload = JsonSerializer.Deserialize<SocialAuthStatePayload>(payloadJson)
            ?? throw new InvalidOperationException("Invalid OAuth state payload");

        if (payload.ExpiresAt <= utcNow)
            throw new InvalidOperationException("OAuth state has expired");

        if (!string.IsNullOrWhiteSpace(expectedUserId)
            && !string.Equals(payload.UserId, expectedUserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("OAuth state does not belong to the current user");

        if (!string.Equals(payload.Platform, NormalizePlatform(platform), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("OAuth state platform mismatch");

        return new SocialAuthState(payload.TeamId, payload.ChannelId, payload.UserId, payload.Platform, payload.ExpiresAt);
    }

    private string Sign(string payloadToken)
    {
        using var hmac = new HMACSHA256(_secret);
        return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadToken)));
    }

    private static string NormalizePlatform(string platform)
    {
        return platform.Trim().ToLowerInvariant();
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
        return Convert.FromBase64String(padded);
    }

    private record SocialAuthStatePayload(
        Guid TeamId,
        int ChannelId,
        string UserId,
        string Platform,
        string Nonce,
        DateTime ExpiresAt);
}
