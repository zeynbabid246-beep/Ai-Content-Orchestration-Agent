using AiContentFlow.Application.Features.Auth.Dtos;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace AiContentFlow.Application.Common.Interfaces
{
   public interface IRefreshTokenRepository
    {
        Task AddAsync(string userId, string token, DateTime expiresAt);
        Task<RefreshTokenDto?> GetByTokenAsync(string token);
        Task RevokeAsync(string token);
    }
}
