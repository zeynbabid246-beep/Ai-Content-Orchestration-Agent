using System;

namespace AiContentFlow.Infrastructure.Identity;

public class RefreshToken
{
    public int      Id              { get; set; }
    public string?  Token           { get; set; }
    public required string UserId   { get; set; }
    public DateTime ExpiresAt       { get; set; }  // was ExpiryDate
    public bool     IsRevoked       { get; set; } = false;
    public DateTime CreatedAt       { get; set; }
    public DateTime RevokedAt       { get; set; }
    public string?  ReplacedByToken { get; set; }

    public ApplicationUser? User    { get; set; }
}