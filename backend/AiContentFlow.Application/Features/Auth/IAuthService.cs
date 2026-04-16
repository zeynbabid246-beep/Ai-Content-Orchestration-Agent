using AiContentFlow.Application.Features.Auth.Dtos;

namespace AiContentFlow.Application.Features.Auth
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);

        Task<AuthResponseDto> RefreshAsync(RefreshRequestDto request);
    }
}
