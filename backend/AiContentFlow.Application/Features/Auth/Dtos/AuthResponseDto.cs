namespace AiContentFlow.Application.Features.Auth.Dtos
{
    public class AuthResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public Guid TeamId { get; set; }
        public string TeamRole { get; set; } = string.Empty;
        public bool IsTeamNameSetupRequired { get; set; }
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
    }
}
