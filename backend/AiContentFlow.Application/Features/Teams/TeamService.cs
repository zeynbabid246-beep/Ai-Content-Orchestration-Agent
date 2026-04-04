using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AiContentFlow.Application.Features.Teams;

public class TeamService : ITeamService
{
    private readonly ITeamRepository _repo;

    public TeamService(ITeamRepository repo) => _repo = repo;

    public async Task<TeamResponseDto> CreateTeamAsync(string ownerId, CreateTeamDto dto)
    {
        if (!await _repo.UserExistsAsync(ownerId))
            throw new InvalidOperationException("User not found");

        if (await _repo.GetTeamByNameAsync(dto.Name) != null)
            throw new InvalidOperationException("Team already exists");

        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = ownerId,
            TeamId = team.Id,
            Role = TeamRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        await _repo.AddTeamAsync(team);
        await _repo.AddUserTeamAsync(userTeam);
        await _repo.SaveChangesAsync();

        return new TeamResponseDto(team.Id, team.Name, team.CreatedAt, 1);
    }

    public async Task<List<TeamMemberDto>> GetMembersAsync(Guid teamId, string requestUserId)
    {
        _ = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new InvalidOperationException("Team not found");

        if (!await _repo.IsUserMemberAsync(teamId, requestUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var members = await _repo.GetTeamMembersAsync(teamId);

        
        return members.Select(m => new TeamMemberDto(
            m.User.Id,
            m.User.UserName,   
            m.UserTeam.Role.ToString(),
            m.UserTeam.JoinedAt
        )).ToList();
    }

    public async Task InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto)
    {
        _ = await _repo.GetTeamByIdAsync(teamId)
            ?? throw new InvalidOperationException("Team not found");

        var requester = await _repo.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (requester.Role != TeamRole.Owner && requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Owner/Admin can invite");

        var user = await _repo.GetUserByUsernameOrEmailAsync(dto.Username)
            ?? throw new InvalidOperationException("User not found");

        if (await _repo.IsUserMemberAsync(teamId, user.Id))
            throw new InvalidOperationException("User already a member");

        if (!Enum.TryParse<TeamRole>(dto.Role, true, out var role) || role == TeamRole.Owner)
            throw new InvalidOperationException("Invalid role");

        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
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
            ?? throw new InvalidOperationException("Target not in team");

        var isSelf = requestingUserId == targetUserId;

        if (!isSelf && requester.Role != TeamRole.Owner && requester.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Not allowed");

        if (!isSelf && target.Role == TeamRole.Owner && requester.Role != TeamRole.Owner)
            throw new UnauthorizedAccessException("Only owner can remove owner");

        if (target.Role == TeamRole.Owner)
        {
            if (await _repo.CountOwnersAsync(teamId) <= 1)
                throw new InvalidOperationException("Cannot remove last owner");
        }

        await _repo.RemoveUserTeamAsync(target);
        await _repo.SaveChangesAsync();
    }
}