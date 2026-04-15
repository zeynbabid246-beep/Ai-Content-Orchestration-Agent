using AiContentFlow.Application.Features.Auth.Dtos;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AiContentFlow.Application.Common.Interfaces
{
   public interface IRefreshTokenRepository
    {
        Task AddAsync(string userId, string token, string? email, string? username, DateTime expiresAt);
        Task<RefreshTokenDto?> GetByTokenAsync(string token);
        Task RotateAsync(string oldToken, string newToken, string userId, string? email, string? username, DateTime expiresAt);
        Task RevokeAsync(string token);
        Task RevokeByTokenHashAsync(string tokenHash);
    }
}
