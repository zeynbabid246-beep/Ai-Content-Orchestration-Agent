using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ITeamRepository
{
    Task<bool> UserExistsAsync(string userId);
    Task<Team?> GetTeamByIdAsync(Guid teamId);
    Task<Team?> GetTeamByNameAsync(string name);
    Task<bool> IsUserMemberAsync(Guid teamId, string userId);
    Task<UserTeam?> GetUserMembershipAsync(Guid teamId, string userId);
    Task<int> CountAdminsAsync(Guid teamId);
    Task<List<(UserTeam UserTeam, string UserId, string Username, string Email)>> GetTeamMembersAsync(Guid teamId);
    Task<(string UserId, string Username, string Email)?> GetUserByUsernameOrEmailAsync(string value);
    Task<(UserTeam UserTeam, Team Team)?> GetPrimaryMembershipAsync(string userId);
    Task AddTeamAsync(Team team);
    Task AddUserTeamAsync(UserTeam userTeam);
    Task RemoveUserTeamAsync(UserTeam userTeam);
    Task SaveChangesAsync();
}