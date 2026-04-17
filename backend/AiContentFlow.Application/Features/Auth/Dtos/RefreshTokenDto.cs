namespace AiContentFlow.Application.Features.Auth.Dtos
{
    public class RefreshTokenDto
    {
        public required string TokenHash { get; set; }
        public required string UserId { get; set; }
        public string? Email { get; set; }
        public string? Username { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public string? ReplacedByTokenHash { get; set; }
    }
}
