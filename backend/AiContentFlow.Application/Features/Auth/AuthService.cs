using AiContentFlow.Application.Common.Interfaces;

using AiContentFlow.Application.Features.Auth.Dtos;
using System;
using System.Threading.Tasks;
namespace AiContentFlow.Application.Features.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IIdentityService _identityService;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IRefreshTokenRepository _refreshTokenRepository;

        public AuthService(
           IIdentityService identityService,
            IJwtTokenGenerator jwtTokenGenerator,
            IRefreshTokenRepository refreshTokenRepository)
        {
            _identityService = identityService;
            _jwtTokenGenerator = jwtTokenGenerator;
            _refreshTokenRepository = refreshTokenRepository;

        }

        

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
         var result = await _identityService.RegisterAsync(request.Email, request.Password, request.Username);

            if (!result.Success)
            {
                throw new Exception(string.Join(", ", result.Errors));
            }

            var accessToken = _jwtTokenGenerator.GenerateToken(result.UserId, request.Email);

            // (we’ll implement refresh token properly later)
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
            await _refreshTokenRepository.AddAsync(
                result.UserId,
                refreshToken,
                DateTime.UtcNow.AddDays(7));




            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var result = await _identityService.LoginAsync(request.Email, request.Password); 
            if (!result.Success) { 
                throw new Exception("Invalid credentials");
            }

            var accessToken = _jwtTokenGenerator.GenerateToken(result.UserId, request.Email);

            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
            await _refreshTokenRepository.AddAsync(
                result.UserId,
                refreshToken,
                DateTime.UtcNow.AddDays(7));


            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }


        public async Task<AuthResponseDto> RefreshAsync(RefreshRequestDto request)
        {
            var tokenData = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);

            if (tokenData == null)
                throw new Exception("Invalid refresh token");

            if (tokenData.IsRevoked)
                throw new Exception("Token revoked");

            if (tokenData.ExpiresAt < DateTime.UtcNow)
                throw new Exception("Token expired");

            // Generate new access token
            var accessToken = _jwtTokenGenerator.GenerateToken(tokenData.UserId, "");

            // 🔁 Optional: rotate refresh token
            await _refreshTokenRepository.RevokeAsync(request.RefreshToken);

            var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            await _refreshTokenRepository.AddAsync(
                tokenData.UserId,
                newRefreshToken,
                DateTime.UtcNow.AddDays(7)
            );

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken
            };
        }

    }
}