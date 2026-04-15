using System;

namespace AiContentFlow.Infrastructure.Identity;

public class RefreshToken
{
    public int Id { get; set; }
    public required string TokenHash { get; set; }
    public required string UserId { get; set; }
    public string? Email { get; set; }
    public string? Username { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public ApplicationUser? User { get; set; }
}