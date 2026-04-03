using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;

namespace AiContentFlow.Infrastructure.Persistence.Services;

public class TeamService : ITeamService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<TeamService> _logger;

    public TeamService(AppDbContext dbContext, ILogger<TeamService> logger)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<TeamResponseDto> CreateTeamAsync(string ownerId, CreateTeamDto dto)
    {     var ownerExists = await _dbContext.Users.AnyAsync(u => u.Id == ownerId);
    if (!ownerExists)
        throw new InvalidOperationException($"User '{ownerId}' not found.");
        // Check for duplicate team name
        var existingTeam = await _dbContext.Teams
            .FirstOrDefaultAsync(t => t.Name.ToLower() == dto.Name.ToLower());

        if (existingTeam is not null)
        {
            throw new InvalidOperationException($"Team with name '{dto.Name}' already exists.");
        }

        // Create team
        var team = new Team
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Teams.Add(team);
        await _dbContext.SaveChangesAsync();

        // Add owner as first member
        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = ownerId,  // string from Identity
            TeamId = team.Id,
            Role = TeamRole.Owner,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.UserTeams.Add(userTeam);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created team {TeamId} with name {TeamName}", team.Id, team.Name);

        return new TeamResponseDto(team.Id, team.Name, team.CreatedAt, 1);
    }

    public async Task<List<TeamMemberDto>> GetMembersAsync(Guid teamId, string requestUserId)
    {
        // Verify team exists
        var team = await _dbContext.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team is null)
            throw new InvalidOperationException($"Team with ID '{teamId}' not found.");

        // Verify requester is a member
        var isMember = await _dbContext.UserTeams
            .AnyAsync(ut => ut.TeamId == teamId && ut.UserId == requestUserId);

        if (!isMember)
            throw new UnauthorizedAccessException("You are not a member of this team.");

        // Get all members with user details
        var members = await _dbContext.UserTeams
            .Where(ut => ut.TeamId == teamId)
            .Join(
                _dbContext.Users,
                ut => ut.UserId,
                u => u.Id,
                (ut, u) => new TeamMemberDto(
                    u.Id,
                    u.UserName ?? u.Email ?? "Unknown",
                    ut.Role.ToString(),
                    ut.JoinedAt
                ))
            .ToListAsync();

        return members;
    }

    public async Task InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto)
    {
        // Verify team exists
        var team = await _dbContext.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team is null)
            throw new InvalidOperationException($"Team with ID '{teamId}' not found.");

        // Verify requester is owner or admin
        var requesterMembership = await _dbContext.UserTeams
            .FirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.UserId == requestingUserId);

        if (requesterMembership is null)
            throw new UnauthorizedAccessException("You are not a member of this team.");

        if (requesterMembership.Role != TeamRole.Owner && requesterMembership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only team owners or admins can invite users.");

        // Find user by username
        var targetUser = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.UserName == dto.Username || u.Email == dto.Username);

        if (targetUser is null)
            throw new InvalidOperationException($"User '{dto.Username}' not found.");

        // Check if already a member
        var isAlreadyMember = await _dbContext.UserTeams
            .AnyAsync(ut => ut.TeamId == teamId && ut.UserId == targetUser.Id);

        if (isAlreadyMember)
            throw new InvalidOperationException($"User '{dto.Username}' is already a team member.");

        // Parse and validate role
        if (!Enum.TryParse<TeamRole>(dto.Role, true, out var role))
            throw new InvalidOperationException($"Invalid role '{dto.Role}'.");

        if (role == TeamRole.Owner)
            throw new InvalidOperationException("Cannot assign Owner role via invite.");

        // Add member
        var userTeam = new UserTeam
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            TeamId = teamId,
            Role = role,
            JoinedAt = DateTime.UtcNow
        };

        _dbContext.UserTeams.Add(userTeam);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Invited user {UserId} to team {TeamId}", targetUser.Id, teamId);
    }

    public async Task RemoveUserAsync(Guid teamId, string requestingUserId, string targetUserId)
    {
        // Verify team exists
        var team = await _dbContext.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team is null)
            throw new InvalidOperationException($"Team with ID '{teamId}' not found.");

        // Get requester membership
        var requesterMembership = await _dbContext.UserTeams
            .FirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.UserId == requestingUserId);

        if (requesterMembership is null)
            throw new UnauthorizedAccessException("You are not a member of this team.");

        // Users can remove themselves, or Owner/Admin can remove others
        var isSelfRemoval = requestingUserId == targetUserId;

        if (!isSelfRemoval && requesterMembership.Role != TeamRole.Owner && requesterMembership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only team owners or admins can remove other members.");

        // Get target membership
        var targetMembership = await _dbContext.UserTeams
            .FirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.UserId == targetUserId);

        if (targetMembership is null)
            throw new InvalidOperationException("Target user is not a member of this team.");

        // Only Owner can remove other Owners
        if (!isSelfRemoval && targetMembership.Role == TeamRole.Owner && requesterMembership.Role != TeamRole.Owner)
            throw new UnauthorizedAccessException("Only team owners can remove other owners.");

        // Prevent removing the last owner
        if (targetMembership.Role == TeamRole.Owner)
        {
            var ownerCount = await _dbContext.UserTeams
                .CountAsync(ut => ut.TeamId == teamId && ut.Role == TeamRole.Owner);

            if (ownerCount <= 1)
                throw new InvalidOperationException("Cannot remove the last owner from the team.");
        }

        _dbContext.UserTeams.Remove(targetMembership);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Removed user {UserId} from team {TeamId}", targetUserId, teamId);
    }
}