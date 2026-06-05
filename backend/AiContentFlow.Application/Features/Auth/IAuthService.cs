using AiContentFlow.Application.Features.Auth.Dtos;

namespace AiContentFlow.Application.Features.Auth
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task<AuthResponseDto> RefreshAsync(RefreshRequestDto request);
        Task<MessageResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<MessageResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request);
        Task<MessageResponseDto> ChangePasswordAsync(string userId, ChangePasswordRequestDto request);
        Task LogoutAsync(LogoutRequestDto request);
    }
}
