using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.BrandStudio.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.BrandStudio;

public class BrandStudioService : IBrandStudioService
{
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IBrandImportJobScheduler _importJobScheduler;
    private readonly IValidator<CreateBrandImportDto> _createImportValidator;

    public BrandStudioService(
        IBrandStudioRepository brandStudioRepository,
        ITeamRepository teamRepository,
        IBrandImportJobScheduler importJobScheduler,
        IValidator<CreateBrandImportDto> createImportValidator)
    {
        _brandStudioRepository = brandStudioRepository;
        _teamRepository = teamRepository;
        _importJobScheduler = importJobScheduler;
        _createImportValidator = createImportValidator;
    }

    public async Task<BrandStudioSnapshotDto> GetAsync(Guid teamId, string requestingUserId)
    {
        await EnsureTeamMemberAsync(teamId, requestingUserId);

        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        return new BrandStudioSnapshotDto(brandStudio is null ? null : Map(brandStudio));
    }

    public async Task<CreateBrandImportResponseDto> StartImportAsync(
        Guid teamId,
        string requestingUserId,
        CreateBrandImportDto dto)
    {
        await _createImportValidator.ValidateAndThrowAsync(dto);
        await EnsureTeamAdminAsync(teamId, requestingUserId);

        var utcNow = DateTime.UtcNow;
        var websiteUrl = dto.WebsiteUrl.Trim();
        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);

        if (brandStudio is null)
        {
            brandStudio = new TeamBrandStudio
            {
                TeamId = teamId,
                WebsiteUrl = websiteUrl,
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            };

            await _brandStudioRepository.AddBrandStudioAsync(brandStudio);
            await _brandStudioRepository.SaveChangesAsync();
        }
        else
        {
            brandStudio.WebsiteUrl = websiteUrl;
            brandStudio.UpdatedAt = utcNow;
        }

        var importJob = new BrandImportJob
        {
            TeamId = teamId,
            TeamBrandStudioId = brandStudio.Id,
            WebsiteUrl = websiteUrl,
            Status = BrandImportJobStatus.Queued,
            CreatedAt = utcNow
        };

        await _brandStudioRepository.AddImportJobAsync(importJob);
        await _brandStudioRepository.SaveChangesAsync();

        await _importJobScheduler.ScheduleAsync(importJob.Id);

        brandStudio.ImportJobs.Add(importJob);

        return new CreateBrandImportResponseDto(Map(brandStudio), Map(importJob));
    }

    public async Task<BrandImportJobDto> GetJobAsync(Guid teamId, int jobId, string requestingUserId)
    {
        await EnsureTeamMemberAsync(teamId, requestingUserId);

        var job = await _brandStudioRepository.GetJobByIdAsync(teamId, jobId)
            ?? throw new KeyNotFoundException("Brand import job not found");

        return Map(job);
    }

    private async Task EnsureTeamMemberAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");
    }

    private async Task EnsureTeamAdminAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can import Brand Studio context");
    }

    private static TeamBrandStudioDto Map(TeamBrandStudio brandStudio)
    {
        var latestJob = brandStudio.ImportJobs
            .OrderByDescending(job => job.CreatedAt)
            .ThenByDescending(job => job.Id)
            .FirstOrDefault();

        return new TeamBrandStudioDto(
            brandStudio.Id,
            brandStudio.TeamId,
            brandStudio.WebsiteUrl,
            brandStudio.CompanyName,
            brandStudio.Description,
            brandStudio.Mission,
            brandStudio.TargetAudience,
            ReadKeywords(brandStudio.KeywordsJson),
            brandStudio.ToneOfVoice,
            brandStudio.CreatedAt,
            brandStudio.UpdatedAt,
            latestJob is null ? null : Map(latestJob));
    }

    private static BrandImportJobDto Map(BrandImportJob job)
    {
        return new BrandImportJobDto(
            job.Id,
            job.TeamBrandStudioId,
            job.Status.ToString().ToLowerInvariant(),
            job.WebsiteUrl,
            job.StartedAt,
            job.CompletedAt,
            job.Error,
            job.CreatedAt);
    }

    private static IReadOnlyList<string> ReadKeywords(string? keywordsJson)
    {
        if (string.IsNullOrWhiteSpace(keywordsJson))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(keywordsJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
