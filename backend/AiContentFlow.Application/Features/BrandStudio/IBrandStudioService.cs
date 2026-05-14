using AiContentFlow.Application.Features.BrandStudio.Dtos;

namespace AiContentFlow.Application.Features.BrandStudio;

public interface IBrandStudioService
{
    Task<BrandStudioSnapshotDto> GetAsync(Guid teamId, string requestingUserId);
    Task<CreateBrandImportResponseDto> StartImportAsync(Guid teamId, string requestingUserId, CreateBrandImportDto dto);
    Task<BrandImportJobDto> GetJobAsync(Guid teamId, int jobId, string requestingUserId);
}
