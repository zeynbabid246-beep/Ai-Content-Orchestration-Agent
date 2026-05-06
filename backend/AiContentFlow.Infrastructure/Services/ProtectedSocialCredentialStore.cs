using System.Text;
using System.Security.Cryptography;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Configuration;

namespace AiContentFlow.Infrastructure.Services;

public class ProtectedSocialCredentialStore : ISocialCredentialStore
{
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private const string Prefix = "v1:";
    private readonly byte[] _key;

    public ProtectedSocialCredentialStore(IConfiguration configuration)
    {
        var secret = configuration["SocialAuth:CredentialSecret"] ?? configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Social credential encryption secret is not configured");

        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public Task StoreAsync(SocialAccount account, string accessToken, string? refreshToken, DateTime tokenExpiry)
    {
        account.OAuthToken = Protect(accessToken);
        account.RefreshToken = string.IsNullOrWhiteSpace(refreshToken) ? null : Protect(refreshToken);
        account.TokenExpiry = tokenExpiry;
        return Task.CompletedTask;
    }

    public Task<string> GetAccessTokenAsync(SocialAccount account)
    {
        return Task.FromResult(Unprotect(account.OAuthToken));
    }

    public Task<string?> GetRefreshTokenAsync(SocialAccount account)
    {
        return Task.FromResult(string.IsNullOrWhiteSpace(account.RefreshToken)
            ? null
            : Unprotect(account.RefreshToken));
    }

    private string Protect(string value)
    {
        var plaintext = Encoding.UTF8.GetBytes(value);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);

        var payload = new byte[nonce.Length + tag.Length + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, nonce.Length + tag.Length, ciphertext.Length);

        return Prefix + Convert.ToBase64String(payload);
    }

    private string Unprotect(string value)
    {
        if (!value.StartsWith(Prefix, StringComparison.Ordinal))
            return value;

        var payload = Convert.FromBase64String(value[Prefix.Length..]);
        if (payload.Length < NonceSize + TagSize)
            throw new InvalidOperationException("Stored social credential is invalid");

        var nonce = payload[..NonceSize];
        var tag = payload[NonceSize..(NonceSize + TagSize)];
        var ciphertext = payload[(NonceSize + TagSize)..];
        var plaintext = new byte[ciphertext.Length];

        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return Encoding.UTF8.GetString(plaintext);
    }
}
