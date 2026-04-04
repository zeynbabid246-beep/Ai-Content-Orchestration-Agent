using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth.Dtos;
using AiContentFlow.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using AiContentFlow.Infrastructure.Persistence;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _dbContext;

    public RefreshTokenRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(string userId, string token, DateTime expiresAt)
    {
        var refreshToken = new RefreshToken
        {
            UserId    = userId,
            Token     = token,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,       
            IsRevoked = false
        };

        _dbContext.RefreshTokens.Add(refreshToken);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<RefreshTokenDto?> GetByTokenAsync(string token)
    {
        var entity = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (entity == null)
            return null;

        return new RefreshTokenDto
        {
            Token     = entity.Token,
            UserId    = entity.UserId,
            ExpiresAt = entity.ExpiresAt, 
            IsRevoked = entity.IsRevoked
        };
    }

    public async Task RevokeAsync(string token)
    {
        var entity = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (entity == null)
            return;

        entity.IsRevoked = true;
        await _dbContext.SaveChangesAsync();
    }
}