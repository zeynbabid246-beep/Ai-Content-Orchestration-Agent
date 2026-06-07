using AiContentFlow.Application.Features.BrandStudio.Dtos;

namespace AiContentFlow.Application.Features.BrandStudio;

public interface IBrandStudioService
{
    Task<BrandStudioSnapshotDto> GetAsync(Guid teamId, string requestingUserId);
    Task<CreateBrandImportResponseDto> StartImportAsync(Guid teamId, string requestingUserId, CreateBrandImportDto dto);
    Task<TeamBrandStudioDto> CreateManualAsync(Guid teamId, string requestingUserId, CreateManualBrandStudioDto dto);
    Task<BrandImportJobDto> GetJobAsync(Guid teamId, int jobId, string requestingUserId);
    Task<List<BrandImportJobDto>> GetJobsAsync(Guid teamId, string requestingUserId);
    Task<TeamBrandStudioDto> UpdateAsync(Guid teamId, string requestingUserId, UpdateBrandStudioDto dto);
}
