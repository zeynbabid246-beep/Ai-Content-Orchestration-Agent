using AiContentFlow.Application.Common;
using AiContentFlow.Application.Common.Email;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Common.Security;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AiContentFlow.Application.Features.Teams;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repo;
    private readonly ITeamInvitationRepository _invitationRepo;
    private readonly IEmailService _emailService;
    private readonly AppSettings _appSettings;
    private readonly ITeamActivityService _activityService;
    private readonly ILogger<TeamService> _logger;

    public TeamService(
        ITeamRepository repo,
        ITeamInvitationRepository invitationRepo,
        IEmailService emailService,
        ITeamActivityService activityService,
        IOptions<AppSettings> appSettings,
        ILogger<TeamService> logger)
    {
        _repo = repo;
        _invitationRepo = invitationRepo;
        _emailService = emailService;
        _activityService = activityService;
        _appSettings = appSettings.Value;
        _logger = logger;
    }

    public Task<List<TeamActivityEventDto>> GetTeamActivityAsync(
        Guid teamId,
        string requestingUserId,
        int limit = 50) =>
        _activityService.GetRecentAsync(teamId, requestingUserId, limit);

    public async Task<TeamResponseDto> CreateTeamAsync(string adminId, CreateTeamDto dto)
    {
        if (!await _repo.UserExistsAsync(adminId))
            throw new KeyNotFoundException("User not found");

        var normalizedName = dto.Name.Trim();

        if (normalizedName.Length > 100)
            throw new InvalidOperationException("Team name cannot exceed 100 characters");

        if (await _repo.GetTeamByNameAsync(normalizedName) != null)
            throw new InvalidOperationException("Team already exists");

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            IsNameSetupRequired = false,
            CreatedAt = DateTime.UtcNow
        };

        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = adminId,
            TeamId = team.Id,
            Role = TeamRole.Admin,
            JoinedAt = DateTime.UtcNow
        };

        await _repo.AddTeamAsync(team);
        await _repo.AddUserTeamAsync(userTeam);
        await _repo.SaveChangesAsync();

        return new TeamResponseDto(team.Id, team.Name, team.CreatedAt, 1);
    }

    public async Task<TeamResponseDto> SetTeamNameAsync(Guid teamId, string requestingUserId, SetTeamNameDto dto)
    {
        var team = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can update team name");

        var normalizedName = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
            throw new InvalidOperationException("Team name is required");

        if (normalizedName.Length > 100)
            throw new InvalidOperationException("Team name cannot exceed 100 characters");

        var existingByName = await _repo.GetTeamByNameAsync(normalizedName);
        if (existingByName is not null && existingByName.Id != teamId)
            throw new InvalidOperationException("Team already exists");

        team.Name = normalizedName;
        team.IsNameSetupRequired = false;

        await _repo.SaveChangesAsync();

        var memberCount = (await _repo.GetTeamMembersAsync(teamId)).Count;
        return new TeamResponseDto(team.Id, team.Name, team.CreatedAt, memberCount);
    }

    public async Task<List<TeamMemberDto>> GetMembersAsync(Guid teamId, string requestUserId)
    {
        _ = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _repo.IsUserMemberAsync(teamId, requestUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var members = await _repo.GetTeamMembersAsync(teamId);

        return members.Select(m => new TeamMemberDto(
            m.UserId,
            m.Username,
            m.UserTeam.Role.ToString(),
            m.UserTeam.JoinedAt
        )).ToList();
    }

    public async Task<InviteUserResponseDto> InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto)
    {
        var team = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can invite users");

        if (!Enum.TryParse<TeamRole>(dto.Role, true, out var role) || role == TeamRole.Admin)
            throw new InvalidOperationException("Invalid role");

        var identifier = dto.Username.Trim();
        var user = await _repo.GetUserByUsernameOrEmailAsync(identifier);
        string? emailWarning = null;

        if (user != null)
        {
            if (await _repo.IsUserMemberAsync(teamId, user.Value.UserId))
                throw new InvalidOperationException("User already a member");

            var userTeam = new UserTeam
            {
                Id = Guid.NewGuid(),
                UserId = user.Value.UserId,
                TeamId = teamId,
                Role = role,
                JoinedAt = DateTime.UtcNow
            };

            await _repo.AddUserTeamAsync(userTeam);
            await _repo.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(user.Value.Email))
            {
                emailWarning = await TrySendInviteEmailAsync(
                    user.Value.Email,
                    team.Name,
                    role.ToString(),
                    requester.Role.ToString(),
                    $"{FrontendBaseUrl}/app/login",
                    "Go to Dashboard",
                    "You have been added to the team. Sign in to access your workspace.");
            }

            await _activityService.LogAsync(
                teamId,
                requestingUserId,
                TeamActivityActions.MemberInvited,
                "User",
                user.Value.UserId,
                $"{{\"role\":\"{role}\"}}");

            return new InviteUserResponseDto("User added to the team.", emailWarning);
        }

        if (!identifier.Contains('@'))
            throw new KeyNotFoundException("User not found. Provide a valid email to invite someone new.");

        var normalizedEmail = NormalizeEmail(identifier);
        var rawToken = InvitationTokenHelper.GenerateToken();
        var tokenHash = InvitationTokenHelper.HashToken(rawToken);

        await _invitationRepo.RevokePendingForTeamEmailAsync(teamId, normalizedEmail);

        var invitation = new TeamInvitation
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            Email = normalizedEmail,
            Role = role,
            InvitedByUserId = requestingUserId,
            TokenHash = tokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await _invitationRepo.AddAsync(invitation);
        await _invitationRepo.SaveChangesAsync();

        var registerLink =
            $"{FrontendBaseUrl}/app/register?token={Uri.EscapeDataString(rawToken)}&email={Uri.EscapeDataString(normalizedEmail)}";

        emailWarning = await TrySendInviteEmailAsync(
            normalizedEmail,
            team.Name,
            role.ToString(),
            requester.Role.ToString(),
            registerLink,
            "Create account",
            "Create your account to join the team and start collaborating.");

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.MemberInvited,
            "Invitation",
            invitation.Id.ToString(),
            $"{{\"email\":\"{normalizedEmail}\",\"role\":\"{role}\"}}");

        return new InviteUserResponseDto("Invitation sent.", emailWarning);
    }

    public async Task<List<TeamInvitationDto>> GetPendingInvitationsAsync(Guid teamId, string requestingUserId)
    {
        _ = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can view invitations");

        var invitations = await _invitationRepo.GetPendingForTeamAsync(teamId);
        return invitations.Select(i => new TeamInvitationDto(
            i.Id,
            i.Email,
            i.Role.ToString(),
            i.CreatedAt,
            i.ExpiresAt)).ToList();
    }

    public async Task RevokeInvitationAsync(Guid teamId, string requestingUserId, Guid invitationId)
    {
        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can revoke invitations");

        var invitation = await _invitationRepo.GetByIdAsync(invitationId)
            ?? throw new KeyNotFoundException("Invitation not found");

        if (invitation.TeamId != teamId)
            throw new KeyNotFoundException("Invitation not found");

        invitation.RevokedAt = DateTime.UtcNow;
        await _invitationRepo.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.InvitationRevoked,
            "Invitation",
            invitation.Id.ToString());
    }

    public async Task<AcceptTeamInvitationResponseDto> AcceptInvitationAsync(string userId, AcceptTeamInvitationDto dto)
    {
        var invitation = await ResolveValidInvitationAsync(dto.Token)
            ?? throw new InvalidOperationException("Invalid or expired invitation.");

        var user = await _repo.GetUserByUsernameOrEmailAsync(invitation.Email)
            ?? throw new KeyNotFoundException("User not found");

        if (!string.Equals(user.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("This invitation was sent to a different account.");

        if (await _repo.IsUserMemberAsync(invitation.TeamId, userId))
        {
            invitation.AcceptedAt = DateTime.UtcNow;
            await _invitationRepo.SaveChangesAsync();
        }
        else
        {
            await AddMemberFromInvitationAsync(invitation, userId);
        }

        var team = invitation.Team ?? await _repo.GetTeamByIdAsync(invitation.TeamId)
            ?? throw new KeyNotFoundException("Team not found");

        await _activityService.LogAsync(
            invitation.TeamId,
            userId,
            TeamActivityActions.InvitationAccepted,
            "Invitation",
            invitation.Id.ToString());

        return new AcceptTeamInvitationResponseDto(team.Id, team.Name, invitation.Role.ToString());
    }

    public async Task<(TeamInvitation Invitation, TeamRole Role)?> TryResolveInvitationForRegistrationAsync(
        string? inviteToken,
        string email)
    {
        TeamInvitation? invitation = null;

        if (!string.IsNullOrWhiteSpace(inviteToken))
        {
            invitation = await ResolveValidInvitationAsync(inviteToken);
        }

        // If token lookup failed (stale/revoked token from an old email), fall back
        // to the most recent valid pending invitation for this email address.
        if (invitation == null)
        {
            invitation = await _invitationRepo.GetPendingByEmailAsync(NormalizeEmail(email));
        }

        if (invitation == null)
            return null;

        if (!string.Equals(invitation.Email, NormalizeEmail(email), StringComparison.OrdinalIgnoreCase))
            return null;

        return (invitation, invitation.Role);
    }

    public async Task CompleteInvitationAfterRegistrationAsync(TeamInvitation invitation, string userId)
    {
        if (await _repo.IsUserMemberAsync(invitation.TeamId, userId))
        {
            invitation.AcceptedAt = DateTime.UtcNow;
            await _invitationRepo.SaveChangesAsync();
            return;
        }

        await AddMemberFromInvitationAsync(invitation, userId);
    }

    public async Task RemoveUserAsync(Guid teamId, string requestingUserId, string targetUserId)
    {
        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a member");

        var target = await _repo.GetUserMembershipAsync(teamId, targetUserId)
            ?? throw new KeyNotFoundException("Target not in team");

        var isSelf = requestingUserId == targetUserId;

        if (!isSelf && requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Not allowed");

        if (target.Role == TeamRole.Admin)
        {
            if (await _repo.CountAdminsAsync(teamId) <= 1)
                throw new InvalidOperationException("Cannot remove last admin");
        }

        await _repo.RemoveUserTeamAsync(target);
        await _repo.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.MemberRemoved,
            "User",
            targetUserId);
    }

    public async Task<List<UserTeamSummaryDto>> GetMyTeamsAsync(string userId)
    {
        if (!await _repo.UserExistsAsync(userId))
            throw new KeyNotFoundException("User not found");

        var teams = await _repo.GetTeamsForUserAsync(userId);
        return teams.Select(t => new UserTeamSummaryDto(
            t.Team.Id,
            t.Team.Name,
            t.UserTeam.Role.ToString(),
            t.UserTeam.JoinedAt)).ToList();
    }

    public async Task<SwitchTeamResponseDto> SwitchTeamAsync(string userId, SwitchTeamDto dto)
    {
        var membership = await _repo.GetUserMembershipAsync(dto.TeamId, userId)
            ?? throw new UnauthorizedAccessException("Not a member of this team");

        var team = await _repo.GetTeamByIdAsync(dto.TeamId)
            ?? throw new KeyNotFoundException("Team not found");

        return new SwitchTeamResponseDto(team.Id, team.Name, membership.Role.ToString());
    }

    public async Task UpdateMemberRoleAsync(Guid teamId, string requestingUserId, UpdateMemberRoleDto dto)
    {
        _ = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        var target = await _repo.GetUserMembershipAsync(teamId, dto.TargetUserId)
            ?? throw new KeyNotFoundException("Target not in team");

        if (!Enum.TryParse<TeamRole>(dto.Role, true, out var newRole))
            throw new InvalidOperationException("Invalid role");

        if (requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can change roles");

        if (newRole == TeamRole.Admin)
            throw new UnauthorizedAccessException("Admin role assignment is not allowed in this flow");

        if (target.Role == TeamRole.Admin)
            throw new UnauthorizedAccessException("Admin role cannot be modified in this flow");

        target.Role = newRole;
        await _repo.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId,
            requestingUserId,
            TeamActivityActions.MemberRoleChanged,
            "User",
            dto.TargetUserId,
            $"{{\"role\":\"{newRole}\"}}");
    }

    private async Task<TeamInvitation?> ResolveValidInvitationAsync(string rawToken)
    {
        var tokenHash = InvitationTokenHelper.HashToken(rawToken);
        var invitation = await _invitationRepo.GetByTokenHashAsync(tokenHash);
        if (invitation == null)
            return null;

        if (invitation.AcceptedAt != null || invitation.RevokedAt != null)
            return null;

        if (invitation.ExpiresAt < DateTime.UtcNow)
            return null;

        return invitation;
    }

    private async Task AddMemberFromInvitationAsync(TeamInvitation invitation, string userId)
    {
        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TeamId = invitation.TeamId,
            Role = invitation.Role,
            JoinedAt = DateTime.UtcNow
        };

        await _repo.AddUserTeamAsync(userTeam);
        invitation.AcceptedAt = DateTime.UtcNow;
        await _invitationRepo.SaveChangesAsync();
        await _repo.SaveChangesAsync();
    }

    private async Task<string?> TrySendInviteEmailAsync(
        string toEmail,
        string teamName,
        string role,
        string inviterRole,
        string link,
        string ctaText,
        string message)
    {
        try
        {
            var subject = $"You have been invited to join team: {teamName}";
            var body = AuthEmailTemplates.TeamInvite(teamName, role, inviterRole, link, ctaText, message);
            await _emailService.SendEmailAsync(toEmail, subject, body);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send invitation email to {Email}", toEmail);
            return "Invitation was saved but the email could not be delivered.";
        }
    }

    private string FrontendBaseUrl => _appSettings.FrontendBaseUrl.TrimEnd('/');

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
