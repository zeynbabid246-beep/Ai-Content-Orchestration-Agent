using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AiContentFlow.Application.Features.Teams.Dtos;

namespace AiContentFlow.Application.Features.Teams;

public interface ITeamService
{
    Task<TeamResponseDto> CreateTeamAsync(string ownerId, CreateTeamDto dto);
    Task<List<TeamMemberDto>> GetMembersAsync(Guid teamId, string requestUserId);  // Fixed: GetMembersAsync not GetMemberAsync
    Task InviteUserAsync(Guid teamId, string requestingUserId, InviteUserDto dto);
    Task RemoveUserAsync(Guid teamId, string requestingUserId, string targetUserId);
}