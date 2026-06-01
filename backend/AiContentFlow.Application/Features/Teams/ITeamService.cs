using AiContentFlow.Application.Features.Teams.Dtos;

namespace AiContentFlow.Application.Features.Teams;

public interface ITeamService
{
    Task<TeamResponseDto> CreateTeamAsync(string ownerId, CreateTeamDto dto);
    Task<TeamResponseDto> SetTeamNameAsync(Guid teamId, string requestingUserId, SetTeamNameDto dto);
    Task<List<TeamMemberDto>> GetMembersAsync(Guid teamId, string requestUserId);
    Task InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto);
    Task RemoveUserAsync(Guid teamId, string requestingUserId, string targetUserId);
    Task UpdateMemberRoleAsync(Guid teamId, string requestingUserId, UpdateMemberRoleDto dto);
    Task<List<UserTeamSummaryDto>> GetMyTeamsAsync(string userId);
    Task<SwitchTeamResponseDto> SwitchTeamAsync(string userId, SwitchTeamDto dto);
}