using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface IBrandStudioRepository
{
    Task<TeamBrandStudio?> GetByTeamAsync(Guid teamId);
    Task<BrandImportJob?> GetJobByIdAsync(Guid teamId, int jobId);
    Task<BrandImportJob?> GetJobByIdForProcessingAsync(int jobId);
    Task AddBrandStudioAsync(TeamBrandStudio brandStudio);
    Task AddImportJobAsync(BrandImportJob importJob);
    Task SaveChangesAsync();
}
