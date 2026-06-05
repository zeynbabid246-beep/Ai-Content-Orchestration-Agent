namespace AiContentFlow.Application.Features.Auth.Dtos;

public class LogoutRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}
