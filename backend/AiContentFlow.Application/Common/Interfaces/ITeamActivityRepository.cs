using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ITeamActivityRepository
{
    Task AddAsync(TeamActivityEvent activityEvent);
    Task<List<TeamActivityEvent>> GetRecentForTeamAsync(Guid teamId, int limit);
    Task SaveChangesAsync();
}
