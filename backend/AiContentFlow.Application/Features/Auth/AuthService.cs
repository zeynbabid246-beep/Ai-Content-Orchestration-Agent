using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Auth
{
    public class AuthService : IAuthService
    {
        private readonly IIdentityService _identityService;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly ITeamRepository _teamRepository;
        private readonly IApplicationTransaction _applicationTransaction;

        public AuthService(
            IIdentityService identityService,
            IJwtTokenGenerator jwtTokenGenerator,
            IRefreshTokenRepository refreshTokenRepository,
            ITeamRepository teamRepository,
            IApplicationTransaction applicationTransaction)
        {
            _identityService = identityService;
            _jwtTokenGenerator = jwtTokenGenerator;
            _refreshTokenRepository = refreshTokenRepository;
            _teamRepository = teamRepository;
            _applicationTransaction = applicationTransaction;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            (bool Success, string UserId, string Email, string Username, IEnumerable<string> Errors) registrationResult = default;
            AuthResponseDto? response = null;

            await _applicationTransaction.ExecuteAsync(async () =>
            {
                registrationResult = await _identityService.RegisterAsync(request.Email, request.Password, request.Username);

                if (!registrationResult.Success)
                {
                    throw new InvalidOperationException(string.Join(", ", registrationResult.Errors));
                }

                var teamNameProvided = !string.IsNullOrWhiteSpace(request.TeamName);
                var normalizedTeamName = BuildInitialTeamName(registrationResult.Username, request.TeamName);

                var team = new Team
                {
                    Id = Guid.NewGuid(),
                    Name = normalizedTeamName,
                    IsNameSetupRequired = !teamNameProvided,
                    CreatedAt = DateTime.UtcNow
                };

                var userTeam = new UserTeam
                {
                    Id = Guid.NewGuid(),
                    UserId = registrationResult.UserId,
                    TeamId = team.Id,
                    Role = TeamRole.Admin,
                    JoinedAt = DateTime.UtcNow
                };

                await _teamRepository.AddTeamAsync(team);
                await _teamRepository.AddUserTeamAsync(userTeam);

                var accessToken = _jwtTokenGenerator.GenerateToken(registrationResult.UserId, registrationResult.Email);
                var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

                await _refreshTokenRepository.AddAsync(
                    registrationResult.UserId,
                    refreshToken,
                    registrationResult.Email,
                    registrationResult.Username,
                    DateTime.UtcNow.AddDays(7));

                response = new AuthResponseDto
                {
                    UserId = registrationResult.UserId,
                    Username = registrationResult.Username,
                    Email = registrationResult.Email,
                    TeamId = team.Id,
                    TeamRole = TeamRole.Admin.ToString(),
                    IsTeamNameSetupRequired = team.IsNameSetupRequired,
                    AccessToken = accessToken,
                    RefreshToken = refreshToken
                };
            });

            return response!;
        }

        private static string BuildInitialTeamName(string username, string? requestedTeamName)
        {
            var candidate = string.IsNullOrWhiteSpace(requestedTeamName)
                ? $"{username.Trim()} Team"
                : requestedTeamName.Trim();

            if (candidate.Length > 100)
                candidate = candidate[..100];

            if (string.IsNullOrWhiteSpace(candidate))
                return "My Team";

            return candidate;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var result = await _identityService.LoginAsync(request.Email, request.Password);
            if (!result.Success)
            {
                throw new UnauthorizedAccessException("Invalid credentials");
            }

            var membership = await _teamRepository.GetPrimaryMembershipAsync(result.UserId)
                ?? throw new UnauthorizedAccessException("User is not assigned to a team");

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
                TeamId = membership.Team.Id,
                TeamRole = membership.UserTeam.Role.ToString(),
                IsTeamNameSetupRequired = membership.Team.IsNameSetupRequired,
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

            var membership = await _teamRepository.GetPrimaryMembershipAsync(tokenData.UserId)
                ?? throw new UnauthorizedAccessException("User is not assigned to a team");

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
                TeamId = membership.Team.Id,
                TeamRole = membership.UserTeam.Role.ToString(),
                IsTeamNameSetupRequired = membership.Team.IsNameSetupRequired,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken
            };
        }
    }
}