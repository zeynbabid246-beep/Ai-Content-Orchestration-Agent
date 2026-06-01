using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Teams;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repo;
    private readonly IEmailService _emailService;

    public TeamService(ITeamRepository repo, IEmailService emailService)
    {
        _repo = repo;
        _emailService = emailService;
    }

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

    public async Task InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto)
    {
        _ = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can invite users");

        var user = await _repo.GetUserByUsernameOrEmailAsync(dto.Username);
        
        var team = await _repo.GetTeamByIdAsync(teamId);

        if (user == null)
        {
            // If the user doesn't exist yet, check if it's an email format.
            if (!dto.Username.Contains("@"))
                throw new KeyNotFoundException("User not found and not a valid email.");

            // Send an external email invite to join the platform
            var extSubject = $"You have been invited to join team: {team!.Name}";
            var extMessage = "You'll need to create an account first to access the team's dashboard and start collaborating.";
            var extCtaLink = "http://localhost:5173/app/register";
            var extCtaText = "Create Account";
            var extBody = GenerateEmailTemplate(team.Name, dto.Role, requester.Role.ToString(), extCtaLink, extCtaText, extMessage);
            
            try
            {
                Console.WriteLine($"[EMAIL SENDING] Attempting to send invite to unregistered email {dto.Username}...");
                await _emailService.SendEmailAsync(dto.Username, extSubject, extBody);
                Console.WriteLine("[EMAIL SENT] Successfully sent invitation email!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR] Failed to send email: {ex.Message}");
            }
            
            // Return early since they aren't registered yet (we can't link them to UserTeam)
            return;
        }

        if (await _repo.IsUserMemberAsync(teamId, user.Value.UserId))
            throw new InvalidOperationException("User already a member");

        if (!Enum.TryParse<TeamRole>(dto.Role, true, out var role) || role == TeamRole.Admin)
            throw new InvalidOperationException("Invalid role");

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

        // Send email invitation notification
        var subject = $"You have been invited to join team: {team!.Name}";
        var intMessage = "Please log in to your account to access your new team dashboard and start collaborating.";
        var intCtaLink = "http://localhost:5173/app/login";
        var intCtaText = "Go to Dashboard";
        var body = GenerateEmailTemplate(team.Name, role.ToString(), requester.Role.ToString(), intCtaLink, intCtaText, intMessage);
        
        try
        {
            if (string.IsNullOrWhiteSpace(user.Value.Email))
            {
                Console.WriteLine($"[EMAIL SKIPPED] The user {user.Value.Username} does not have a registered email address.");
            }
            else
            {
                Console.WriteLine($"[EMAIL SENDING] Attempting to send email to {user.Value.Email}...");
                await _emailService.SendEmailAsync(user.Value.Email, subject, body);
                Console.WriteLine("[EMAIL SENT] Successfully sent invitation email!");
            }
        }
        catch (Exception ex)
        { 
            Console.WriteLine($"[EMAIL ERROR] Failed to send email: {ex.Message}");
            Console.WriteLine(ex.ToString());
        }
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
    }

    private static string GenerateEmailTemplate(string teamName, string role, string inviterRole, string link, string ctaText, string message)
    {
        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin: 0; padding: 0; font-family: ""Inter"", ""Helvetica Neue"", Helvetica, Arial, sans-serif; background-color: #f9f9fb; color: #1e1e24;'>
    <div style='max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);'>
        
        <!-- Header -->
        <div style='background: linear-gradient(135deg, #1e1e24 0%, #2f2f38 100%); padding: 30px 40px; text-align: center;'>
            <h1 style='color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;'>
                <span style='color: #6366f1;'>Ai</span>ContentFlow
            </h1>
        </div>

        <!-- Content -->
        <div style='padding: 40px;'>
            <h2 style='margin-top: 0; font-size: 20px; font-weight: 600; color: #1e1e24;'>You've been invited! 👋</h2>
            
            <p style='font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;'>
                An <strong>{inviterRole}</strong> has invited you to join the team <strong>{teamName}</strong> as a <strong>{role}</strong>.
            </p>
            
            <p style='font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;'>
                {message}
            </p>

            <!-- CTA Button -->
            <div style='text-align: center; margin: 40px 0;'>
                <a href='{link}' style='display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); transition: all 0.2s;'>
                    {ctaText}
                </a>
            </div>
            
            <!-- Context -->
            <p style='font-size: 14px; line-height: 1.5; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;'>
                If you did not expect this invitation, you can safely ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div style='background-color: #f3f4f6; padding: 24px; text-align: center;'>
            <p style='margin: 0; font-size: 13px; color: #6b7280;'>
                © {DateTime.UtcNow.Year} AiContentFlow. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>";
    }
}