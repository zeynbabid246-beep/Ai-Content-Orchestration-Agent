using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Application.Features.Auth.Dtos
{
    public class RefreshTokenDto
    {
        public required string Token { get; set; }
        public required string UserId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
    }
}
