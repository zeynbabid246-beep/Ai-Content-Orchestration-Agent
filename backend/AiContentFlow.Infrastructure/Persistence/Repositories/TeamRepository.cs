using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class TeamRepository : ITeamRepository
{
    private readonly AppDbContext _context;

    public TeamRepository(AppDbContext context) => _context = context;

    public async Task<bool> UserExistsAsync(string userId)
        => await _context.Users.AnyAsync(u => u.Id == userId);

    public async Task<Team?> GetTeamByIdAsync(Guid teamId)
        => await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId);

    public async Task<Team?> GetTeamByNameAsync(string name)
        => await _context.Teams.FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());

    public async Task<bool> IsUserMemberAsync(Guid teamId, string userId)
        => await _context.UserTeams.AnyAsync(ut => ut.TeamId == teamId && ut.UserId == userId);

    public async Task<UserTeam?> GetUserMembershipAsync(Guid teamId, string userId)
        => await _context.UserTeams.FirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.UserId == userId);

    public async Task<int> CountAdminsAsync(Guid teamId)
        => await _context.UserTeams.CountAsync(ut => ut.TeamId == teamId && ut.Role == TeamRole.Admin);

    public async Task<List<(UserTeam UserTeam, string UserId, string Username, string Email)>> GetTeamMembersAsync(Guid teamId)
    {
        return await _context.UserTeams
            .Where(ut => ut.TeamId == teamId)
            .Join(_context.Users,
                ut => ut.UserId,
                u => u.Id,
                (ut, u) => new ValueTuple<UserTeam, string, string, string>(
                    ut,
                    u.Id,
                    u.UserName ?? string.Empty,
                    u.Email ?? string.Empty))
            .ToListAsync();
    }

    public async Task<(string UserId, string Username, string Email)?> GetUserByUsernameOrEmailAsync(string value)
    {
        var appUser = await _context.Users
            .FirstOrDefaultAsync(u => u.UserName == value || u.Email == value);

        if (appUser is null)
        {
            return null;
        }

        return (appUser.Id, appUser.UserName ?? string.Empty, appUser.Email ?? string.Empty);
    }

    public async Task<(UserTeam UserTeam, Team Team)?> GetPrimaryMembershipAsync(string userId)
    {
        var membership = await _context.UserTeams
            .Include(x => x.Team)
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.JoinedAt)
            .FirstOrDefaultAsync();

        if (membership is null || membership.Team is null)
        {
            return null;
        }

        return (membership, membership.Team);
    }

    public async Task AddTeamAsync(Team team)
        => await _context.Teams.AddAsync(team);

    public async Task AddUserTeamAsync(UserTeam userTeam)
        => await _context.UserTeams.AddAsync(userTeam);

    public Task RemoveUserTeamAsync(UserTeam userTeam)
    {
        _context.UserTeams.Remove(userTeam);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
}