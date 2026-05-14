namespace AiContentFlow.Application.Features.BrandStudio.Dtos;

public record CreateBrandImportDto(string WebsiteUrl);

public record BrandImportJobDto(
    int Id,
    int TeamBrandStudioId,
    string Status,
    string WebsiteUrl,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? Error,
    DateTime CreatedAt);

public record TeamBrandStudioDto(
    int Id,
    Guid TeamId,
    string? WebsiteUrl,
    string? CompanyName,
    string? Description,
    string? Mission,
    string? TargetAudience,
    IReadOnlyList<string> Keywords,
    string? ToneOfVoice,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    BrandImportJobDto? LatestImportJob);

public record BrandStudioSnapshotDto(TeamBrandStudioDto? BrandStudio);

public record CreateBrandImportResponseDto(
    TeamBrandStudioDto BrandStudio,
    BrandImportJobDto Job);
