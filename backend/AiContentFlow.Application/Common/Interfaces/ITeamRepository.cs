using AiContentFlow.Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ITeamRepository
{
    Task<bool> UserExistsAsync(string userId);
    Task<Team?> GetTeamByIdAsync(Guid teamId);
    Task<Team?> GetTeamByNameAsync(string name);
    Task<bool> IsUserMemberAsync(Guid teamId, string userId);
    Task<UserTeam?> GetUserMembershipAsync(Guid teamId, string userId);
    Task<int> CountOwnersAsync(Guid teamId);

    Task<List<(UserTeam UserTeam, User User)>> GetTeamMembersAsync(Guid teamId);

    Task<User?> GetUserByUsernameOrEmailAsync(string value);

    Task AddTeamAsync(Team team);
    Task AddUserTeamAsync(UserTeam userTeam);
    Task RemoveUserTeamAsync(UserTeam userTeam);
    Task SaveChangesAsync();
}