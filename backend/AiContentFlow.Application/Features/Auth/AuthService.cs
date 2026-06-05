using AiContentFlow.Application.Common.Email;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.Auth.Dtos;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiContentFlow.Application.Features.Auth
{
    public class AuthService : IAuthService
    {
        private const string ForgotPasswordSuccessMessage =
            "If an account exists for that email, a password reset link has been sent.";

        private readonly IIdentityService _identityService;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly ITeamRepository _teamRepository;
        private readonly ITeamService _teamService;
        private readonly IApplicationTransaction _applicationTransaction;
        private readonly IEmailService _emailService;
        private readonly AppSettings _appSettings;
        private readonly ILogger<AuthService> _logger;
        private readonly IValidator<ForgotPasswordRequestDto> _forgotPasswordValidator;
        private readonly IValidator<ResetPasswordRequestDto> _resetPasswordValidator;
        private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;
        private readonly IValidator<LogoutRequestDto> _logoutValidator;

        public AuthService(
            IIdentityService identityService,
            IJwtTokenGenerator jwtTokenGenerator,
            IRefreshTokenRepository refreshTokenRepository,
            ITeamRepository teamRepository,
            ITeamService teamService,
            IApplicationTransaction applicationTransaction,
            IEmailService emailService,
            IOptions<AppSettings> appSettings,
            ILogger<AuthService> logger,
            IValidator<ForgotPasswordRequestDto> forgotPasswordValidator,
            IValidator<ResetPasswordRequestDto> resetPasswordValidator,
            IValidator<ChangePasswordRequestDto> changePasswordValidator,
            IValidator<LogoutRequestDto> logoutValidator)
        {
            _identityService = identityService;
            _jwtTokenGenerator = jwtTokenGenerator;
            _refreshTokenRepository = refreshTokenRepository;
            _teamRepository = teamRepository;
            _teamService = teamService;
            _applicationTransaction = applicationTransaction;
            _emailService = emailService;
            _appSettings = appSettings.Value;
            _logger = logger;
            _forgotPasswordValidator = forgotPasswordValidator;
            _resetPasswordValidator = resetPasswordValidator;
            _changePasswordValidator = changePasswordValidator;
            _logoutValidator = logoutValidator;
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

                Team team;
                TeamRole memberRole;
                var invitationContext = await _teamService.TryResolveInvitationForRegistrationAsync(
                    request.InviteToken,
                    registrationResult.Email);

                if (invitationContext != null)
                {
                    await _teamService.CompleteInvitationAfterRegistrationAsync(
                        invitationContext.Value.Invitation,
                        registrationResult.UserId);

                    team = invitationContext.Value.Invitation.Team
                        ?? await _teamRepository.GetTeamByIdAsync(invitationContext.Value.Invitation.TeamId)
                        ?? throw new InvalidOperationException("Invitation team not found");

                    memberRole = invitationContext.Value.Role;
                }
                else
                {
                    var teamNameProvided = !string.IsNullOrWhiteSpace(request.TeamName);
                    var normalizedTeamName = BuildInitialTeamName(registrationResult.Username, request.TeamName);

                    team = new Team
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
                    memberRole = TeamRole.Admin;
                }

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
                    TeamRole = memberRole.ToString(),
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

        public async Task<MessageResponseDto> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            await _forgotPasswordValidator.ValidateAndThrowAsync(request);

            var token = await _identityService.GeneratePasswordResetTokenAsync(request.Email);
            if (token != null)
            {
                var baseUrl = _appSettings.FrontendBaseUrl.TrimEnd('/');
                var encodedEmail = Uri.EscapeDataString(request.Email.Trim());
                var encodedToken = Uri.EscapeDataString(token);
                var resetLink = $"{baseUrl}/app/reset-password?email={encodedEmail}&token={encodedToken}";

                try
                {
                    await _emailService.SendEmailAsync(
                        request.Email.Trim(),
                        "Reset your AiContentFlow password",
                        AuthEmailTemplates.PasswordReset(resetLink));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password reset email to {Email}", request.Email);
                }
            }

            return new MessageResponseDto { Message = ForgotPasswordSuccessMessage };
        }

        public async Task<MessageResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            await _resetPasswordValidator.ValidateAndThrowAsync(request);

            var result = await _identityService.ResetPasswordAsync(
                request.Email,
                request.Token,
                request.NewPassword);

            if (!result.Success)
                throw new InvalidOperationException(string.Join(", ", result.Errors));

            return new MessageResponseDto { Message = "Password has been reset. You can sign in with your new password." };
        }

        public async Task<MessageResponseDto> ChangePasswordAsync(string userId, ChangePasswordRequestDto request)
        {
            await _changePasswordValidator.ValidateAndThrowAsync(request);

            var result = await _identityService.ChangePasswordAsync(
                userId,
                request.CurrentPassword,
                request.NewPassword);

            if (!result.Success)
                throw new InvalidOperationException(string.Join(", ", result.Errors));

            return new MessageResponseDto { Message = "Password updated successfully." };
        }

        public async Task LogoutAsync(LogoutRequestDto request)
        {
            await _logoutValidator.ValidateAndThrowAsync(request);
            await _refreshTokenRepository.RevokeAsync(request.RefreshToken);
        }
    }
}
