using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth.Dtos;
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
                throw new InvalidOperationException(string.Join(", ", result.Errors));
            }

            var accessToken = _jwtTokenGenerator.GenerateToken(result.UserId, result.Email);
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            await _refreshTokenRepository.AddAsync(
                result.UserId,
                refreshToken,
                result.Email,
                result.Username,
                DateTime.UtcNow.AddDays(7));



            return new AuthResponseDto
            {
                UserId = result.UserId,
                Username = result.Username,
                Email = result.Email,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var result = await _identityService.LoginAsync(request.Email, request.Password);
            if (!result.Success)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            var accessToken = _jwtTokenGenerator.GenerateToken(result.UserId, result.Email);
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            await _refreshTokenRepository.AddAsync(
                result.UserId,
                refreshToken,
                result.Email,
                result.Username,
                DateTime.UtcNow.AddDays(7));


            return new AuthResponseDto
            {
                UserId = result.UserId,
                Username = result.Username,
                Email = result.Email,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }


        public async Task<AuthResponseDto> RefreshAsync(RefreshRequestDto request)
        {
            var tokenData = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);

            if (tokenData == null)
            {
                throw new UnauthorizedAccessException("Invalid refresh token");
            }

            if (tokenData.IsRevoked)
            {
                if (!string.IsNullOrWhiteSpace(tokenData.ReplacedByTokenHash))
                {
                    await _refreshTokenRepository.RevokeByTokenHashAsync(tokenData.ReplacedByTokenHash);
                }

                throw new UnauthorizedAccessException("Token revoked");
            }

            if (tokenData.ExpiresAt < DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Token expired");
            }

            var accessToken = _jwtTokenGenerator.GenerateToken(tokenData.UserId, tokenData.Email ?? string.Empty);
            var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

            await _refreshTokenRepository.RotateAsync(
                request.RefreshToken,
                newRefreshToken,
                tokenData.UserId,
                tokenData.Email,
                tokenData.Username,
                DateTime.UtcNow.AddDays(7));

            return new AuthResponseDto
            {
                UserId = tokenData.UserId,
                Username = tokenData.Username ?? string.Empty,
                Email = tokenData.Email,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken
            };
        }

    }
}