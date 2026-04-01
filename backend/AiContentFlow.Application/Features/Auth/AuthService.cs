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

        public AuthService(
           IIdentityService identityService,
            IJwtTokenGenerator jwtTokenGenerator)
        {
            _identityService = identityService;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            var result = await _identityService.RegisterAsync(request.Email, request.Password);

            if (!result.Success)
            {
                throw new Exception(string.Join(", ", result.Errors));
            }

            var accessToken = _jwtTokenGenerator.GenerateToken(result.UserId, request.Email);

            // (we’ll implement refresh token properly later)
            var refreshToken = Guid.NewGuid().ToString();

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

            var refreshToken = Guid.NewGuid().ToString(); 

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };
        }
    }
}