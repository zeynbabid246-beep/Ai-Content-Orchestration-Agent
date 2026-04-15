using System.Security.Cryptography;
using System.Text;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth.Dtos;
using AiContentFlow.Infrastructure.Identity;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _dbContext;

    public RefreshTokenRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(string userId, string token, string? email, string? username, DateTime expiresAt)
    {
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            TokenHash = HashToken(token),
            Email = email,
            Username = username,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            IsRevoked = false
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<RefreshTokenDto?> GetByTokenAsync(string token)
    {
        var tokenHash = HashToken(token);

        var entity = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (entity == null)
            return null;

        return new RefreshTokenDto
        {
            TokenHash = entity.TokenHash,
            UserId = entity.UserId,
            Email = entity.Email,
            Username = entity.Username,
            ExpiresAt = entity.ExpiresAt,
            IsRevoked = entity.IsRevoked,
            ReplacedByTokenHash = entity.ReplacedByTokenHash
        };
    }

    public async Task RotateAsync(string oldToken, string newToken, string userId, string? email, string? username, DateTime expiresAt)
    {
        var oldTokenHash = HashToken(oldToken);
        var newTokenHash = HashToken(newToken);

        var existing = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == oldTokenHash);
        if (existing == null)
        {
            return;
        }

        existing.IsRevoked = true;
        existing.RevokedAt = DateTime.UtcNow;
        existing.ReplacedByTokenHash = newTokenHash;

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = newTokenHash,
            Email = email,
            Username = username,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            IsRevoked = false
        });

        await _dbContext.SaveChangesAsync();
    }

    public async Task RevokeAsync(string token)
    {
        var tokenHash = HashToken(token);

        var entity = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (entity == null)
            return;

        entity.IsRevoked = true;
        entity.RevokedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    public async Task RevokeByTokenHashAsync(string tokenHash)
    {
        var entity = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (entity == null)
            return;

        entity.IsRevoked = true;
        entity.RevokedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}