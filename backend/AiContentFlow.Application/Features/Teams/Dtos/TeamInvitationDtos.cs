namespace AiContentFlow.Application.Features.Teams.Dtos;

public record TeamInvitationDto(
    Guid Id,
    string Email,
    string Role,
    DateTime CreatedAt,
    DateTime ExpiresAt);

public record AcceptTeamInvitationDto(string Token);

public record AcceptTeamInvitationResponseDto(
    Guid TeamId,
    string TeamName,
    string TeamRole);

public record InviteUserResponseDto(string Message, string? EmailWarning);
