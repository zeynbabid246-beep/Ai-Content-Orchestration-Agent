using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Teams;

public interface ITeamService
{
    Task<TeamResponseDto> CreateTeamAsync(string ownerId, CreateTeamDto dto);
    Task<TeamResponseDto> SetTeamNameAsync(Guid teamId, string requestingUserId, SetTeamNameDto dto);
    Task<List<TeamMemberDto>> GetMembersAsync(Guid teamId, string requestUserId);
    Task<InviteUserResponseDto> InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto);
    Task RemoveUserAsync(Guid teamId, string requestingUserId, string targetUserId);
    Task UpdateMemberRoleAsync(Guid teamId, string requestingUserId, UpdateMemberRoleDto dto);
    Task<List<UserTeamSummaryDto>> GetMyTeamsAsync(string userId);
    Task<SwitchTeamResponseDto> SwitchTeamAsync(string userId, SwitchTeamDto dto);
    Task<List<TeamInvitationDto>> GetPendingInvitationsAsync(Guid teamId, string requestingUserId);
    Task RevokeInvitationAsync(Guid teamId, string requestingUserId, Guid invitationId);
    Task<AcceptTeamInvitationResponseDto> AcceptInvitationAsync(string userId, AcceptTeamInvitationDto dto);
    Task<(TeamInvitation Invitation, TeamRole Role)?> TryResolveInvitationForRegistrationAsync(string? inviteToken, string email);
    Task CompleteInvitationAfterRegistrationAsync(TeamInvitation invitation, string userId);
    Task<List<TeamActivityEventDto>> GetTeamActivityAsync(Guid teamId, string requestingUserId, int limit = 50);
}
