using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Teams;

public class TeamActivityService : ITeamActivityService
{
    private readonly ITeamRepository _teamRepository;
    private readonly ITeamActivityRepository _activityRepository;

    public TeamActivityService(ITeamRepository teamRepository, ITeamActivityRepository activityRepository)
    {
        _teamRepository = teamRepository;
        _activityRepository = activityRepository;
    }

    public async Task LogAsync(
        Guid teamId,
        string actorUserId,
        string action,
        string? entityType = null,
        string? entityId = null,
        string? metadataJson = null)
    {
        await _activityRepository.AddAsync(new TeamActivityEvent
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            ActorUserId = actorUserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            MetadataJson = metadataJson,
            CreatedAt = DateTime.UtcNow
        });
        await _activityRepository.SaveChangesAsync();
    }

    public async Task<List<TeamActivityEventDto>> GetRecentAsync(
        Guid teamId,
        string requestingUserId,
        int limit = 50)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can view team activity");

        var events = await _activityRepository.GetRecentForTeamAsync(teamId, limit);
        return events.Select(e => new TeamActivityEventDto(
            e.Id,
            e.ActorUserId,
            e.Action,
            e.EntityType,
            e.EntityId,
            e.MetadataJson,
            e.CreatedAt)).ToList();
    }
}
