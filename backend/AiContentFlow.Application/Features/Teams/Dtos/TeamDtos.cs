namespace AiContentFlow.Application.Features.Teams.Dtos;

public record CreateTeamDto(string Name);

public record TeamResponseDto(
    Guid Id,
    string Name,
    DateTime CreatedAt,
    int MemberCount
);

public record TeamMemberDto(
    string UserId,
    string Username,
    string Role,
    DateTime JoinedAt
);

public record InviteUserDto(string Username, string Role);

public record UpdateMemberRoleDto(string TargetUserId, string Role);

public record SetTeamNameDto(string Name);