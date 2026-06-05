using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class TeamInvitationRepository : ITeamInvitationRepository
{
    private readonly AppDbContext _dbContext;

    public TeamInvitationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<TeamInvitation?> GetByTokenHashAsync(string tokenHash)
    {
        return await _dbContext.TeamInvitations
            .Include(i => i.Team)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash);
    }

    public async Task<TeamInvitation?> GetPendingByEmailAsync(string normalizedEmail)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.TeamInvitations
            .Include(i => i.Team)
            .Where(i =>
                i.Email == normalizedEmail &&
                i.AcceptedAt == null &&
                i.RevokedAt == null &&
                i.ExpiresAt > now)
            .OrderByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<TeamInvitation>> GetPendingForTeamAsync(Guid teamId)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.TeamInvitations
            .Where(i =>
                i.TeamId == teamId &&
                i.AcceptedAt == null &&
                i.RevokedAt == null &&
                i.ExpiresAt > now)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<TeamInvitation?> GetByIdAsync(Guid invitationId)
    {
        return await _dbContext.TeamInvitations
            .FirstOrDefaultAsync(i => i.Id == invitationId);
    }

    public async Task AddAsync(TeamInvitation invitation)
    {
        await _dbContext.TeamInvitations.AddAsync(invitation);
    }

    public async Task RevokePendingForTeamEmailAsync(Guid teamId, string normalizedEmail)
    {
        var now = DateTime.UtcNow;
        var pending = await _dbContext.TeamInvitations
            .Where(i =>
                i.TeamId == teamId &&
                i.Email == normalizedEmail &&
                i.AcceptedAt == null &&
                i.RevokedAt == null &&
                i.ExpiresAt > now)
            .ToListAsync();

        foreach (var invitation in pending)
        {
            invitation.RevokedAt = now;
        }
    }

    public Task SaveChangesAsync() => _dbContext.SaveChangesAsync();
}
