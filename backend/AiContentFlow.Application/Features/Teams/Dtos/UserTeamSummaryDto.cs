namespace AiContentFlow.Application.Features.Teams.Dtos;

public record UserTeamSummaryDto(
    Guid TeamId,
    string TeamName,
    string Role,
    DateTime JoinedAt);

public record SwitchTeamDto(Guid TeamId);

public record SwitchTeamResponseDto(
    Guid TeamId,
    string TeamName,
    string TeamRole);
