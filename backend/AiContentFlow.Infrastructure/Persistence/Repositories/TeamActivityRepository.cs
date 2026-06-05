using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class TeamActivityRepository : ITeamActivityRepository
{
    private readonly AppDbContext _dbContext;

    public TeamActivityRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(TeamActivityEvent activityEvent)
    {
        await _dbContext.TeamActivityEvents.AddAsync(activityEvent);
    }

    public async Task<List<TeamActivityEvent>> GetRecentForTeamAsync(Guid teamId, int limit)
    {
        return await _dbContext.TeamActivityEvents
            .Where(e => e.TeamId == teamId)
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public Task SaveChangesAsync() => _dbContext.SaveChangesAsync();
}
