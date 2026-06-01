using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IBrandStudioRepository
{
    Task<TeamBrandStudio?> GetByTeamAsync(Guid teamId);
    Task<BrandImportJob?> GetJobByIdAsync(Guid teamId, int jobId);
    Task<BrandImportJob?> GetJobByIdForProcessingAsync(int jobId);
    Task<int> FailActiveJobsAsync(Guid teamId, string reason);
    Task AddBrandStudioAsync(TeamBrandStudio brandStudio);
    Task AddImportJobAsync(BrandImportJob importJob);
    Task<List<BrandImportJob>> GetRecentJobsAsync(Guid teamId, int take = 20);
    Task SaveChangesAsync();
}
