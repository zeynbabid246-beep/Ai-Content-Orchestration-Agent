using Microsoft.EntityFrameworkCore;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

    public async Task<int> CountOwnersAsync(Guid teamId)
        => await _context.UserTeams.CountAsync(ut => ut.TeamId == teamId && ut.Role == TeamRole.Owner);

    // Fixed: projects ApplicationUser → domain User model to avoid leaking Identity into Application
    public async Task<List<(UserTeam UserTeam, User User)>> GetTeamMembersAsync(Guid teamId)
    {
        return await _context.UserTeams
            .Where(ut => ut.TeamId == teamId)
            .Join(_context.Users,
                ut => ut.UserId,
                u => u.Id,
                (ut, u) => new ValueTuple<UserTeam, User>(
                    ut,
                    new User          // project to domain model, not ApplicationUser
                    {
                        Id = u.Id,
                        UserName = u.UserName ?? string.Empty,
                        Email = u.Email ?? string.Empty
                    }
                ))
            .ToListAsync();
    }

  
    public async Task<User?> GetUserByUsernameOrEmailAsync(string value)
    {
        var appUser = await _context.Users
            .FirstOrDefaultAsync(u => u.UserName == value || u.Email == value);

        if (appUser is null) return null;

        return new User
        {
            Id = appUser.Id,
            UserName = appUser.UserName ?? string.Empty,
            Email = appUser.Email ?? string.Empty
        };
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