using AiContentFlow.Application.Features.Teams.Dtos;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ITeamActivityService
{
    Task LogAsync(
        Guid teamId,
        string actorUserId,
        string action,
        string? entityType = null,
        string? entityId = null,
        string? metadataJson = null);

    Task<List<TeamActivityEventDto>> GetRecentAsync(Guid teamId, string requestingUserId, int limit = 50);
}
