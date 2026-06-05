using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ITeamInvitationRepository
{
    Task<TeamInvitation?> GetByTokenHashAsync(string tokenHash);
    Task<TeamInvitation?> GetPendingByEmailAsync(string normalizedEmail);
    Task<List<TeamInvitation>> GetPendingForTeamAsync(Guid teamId);
    Task<TeamInvitation?> GetByIdAsync(Guid invitationId);
    Task AddAsync(TeamInvitation invitation);
    Task RevokePendingForTeamEmailAsync(Guid teamId, string normalizedEmail);
    Task SaveChangesAsync();
}
