using System;
using System.Collections.Generic;
using System.Text;

namespace AiContentFlow.Infrastructure.Identity
{
    public class RefreshToken
    {
        public int Id { get; set; }

        public string Token { get; set; }

        public DateTime ExpiryDate { get; set; }

        public bool IsRevoked { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime RevokedAt { get; set; }

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
    }
}
