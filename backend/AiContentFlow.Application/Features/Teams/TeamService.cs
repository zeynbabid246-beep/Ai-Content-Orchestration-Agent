using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Teams;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repo;

    public TeamService(ITeamRepository repo) => _repo = repo;

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

        var user = await _repo.GetUserByUsernameOrEmailAsync(dto.Username)
            ?? throw new KeyNotFoundException("User not found");

        if (await _repo.IsUserMemberAsync(teamId, user.UserId))
            throw new InvalidOperationException("User already a member");

        if (!Enum.TryParse<TeamRole>(dto.Role, true, out var role) || role == TeamRole.Admin)
            throw new InvalidOperationException("Invalid role");

        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = user.UserId,
            TeamId = teamId,
            Role = role,
            JoinedAt = DateTime.UtcNow
        };

        await _repo.AddUserTeamAsync(userTeam);
        await _repo.SaveChangesAsync();
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
}