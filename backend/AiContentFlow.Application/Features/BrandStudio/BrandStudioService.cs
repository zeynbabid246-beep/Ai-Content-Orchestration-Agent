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
    private readonly IValidator<CreateManualBrandStudioDto> _createManualValidator;

    public BrandStudioService(
        IBrandStudioRepository brandStudioRepository,
        ITeamRepository teamRepository,
        IBrandImportJobScheduler importJobScheduler,
        IValidator<CreateBrandImportDto> createImportValidator,
        IValidator<CreateManualBrandStudioDto> createManualValidator)
    {
        _brandStudioRepository = brandStudioRepository;
        _teamRepository = teamRepository;
        _importJobScheduler = importJobScheduler;
        _createImportValidator = createImportValidator;
        _createManualValidator = createManualValidator;
    }

    public async Task<BrandStudioSnapshotDto> GetAsync(Guid teamId, string requestingUserId)
    {
        await EnsureTeamMemberAsync(teamId, requestingUserId);

        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        return new BrandStudioSnapshotDto(brandStudio is null ? null : BrandProfileMapper.Map(brandStudio));
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

        await _brandStudioRepository.FailActiveJobsAsync(
            teamId,
            "Superseded by a newer brand import request.");

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

        return new CreateBrandImportResponseDto(BrandProfileMapper.Map(brandStudio), BrandProfileMapper.MapJob(importJob));
    }

    public async Task<TeamBrandStudioDto> CreateManualAsync(
        Guid teamId,
        string requestingUserId,
        CreateManualBrandStudioDto dto)
    {
        await _createManualValidator.ValidateAndThrowAsync(dto);
        await EnsureTeamAdminAsync(teamId, requestingUserId);

        var existing = await _brandStudioRepository.GetByTeamAsync(teamId);
        if (existing is not null)
            throw new InvalidOperationException("Brand Studio profile already exists for this team.");

        var utcNow = DateTime.UtcNow;
        var orgId = !string.IsNullOrWhiteSpace(dto.ParsedProfile.OrgId)
            ? dto.ParsedProfile.OrgId.Trim()
            : $"team_{teamId:N}";

        var brandStudio = new TeamBrandStudio
        {
            TeamId = teamId,
            OrgId = orgId,
            CreatedAt = utcNow,
            UpdatedAt = utcNow
        };

        BrandProfileMapper.ApplyUpdate(brandStudio, new UpdateBrandStudioDto(
            dto.ParsedProfile with { OrgId = orgId },
            dto.EnrichedProfile,
            dto.DefaultConfig));

        if (string.IsNullOrWhiteSpace(brandStudio.BrandName))
            brandStudio.BrandName = "Manual Brand";

        await _brandStudioRepository.AddBrandStudioAsync(brandStudio);
        await _brandStudioRepository.SaveChangesAsync();

        return BrandProfileMapper.Map(brandStudio);
    }

    public async Task<BrandImportJobDto> GetJobAsync(Guid teamId, int jobId, string requestingUserId)
    {
        await EnsureTeamMemberAsync(teamId, requestingUserId);

        var job = await _brandStudioRepository.GetJobByIdAsync(teamId, jobId)
            ?? throw new KeyNotFoundException("Brand import job not found");

        return BrandProfileMapper.MapJob(job);
    }

    public async Task<List<BrandImportJobDto>> GetJobsAsync(Guid teamId, string requestingUserId)
    {
        await EnsureTeamMemberAsync(teamId, requestingUserId);
        var jobs = await _brandStudioRepository.GetRecentJobsAsync(teamId);
        return jobs.Select(BrandProfileMapper.MapJob).ToList();
    }

    public async Task<TeamBrandStudioDto> UpdateAsync(Guid teamId, string requestingUserId, UpdateBrandStudioDto dto)
    {
        await EnsureTeamAdminAsync(teamId, requestingUserId);

        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId)
            ?? throw new KeyNotFoundException("Brand Studio profile not found");

        BrandProfileMapper.ApplyUpdate(brandStudio, dto);
        brandStudio.UpdatedAt = DateTime.UtcNow;
        await _brandStudioRepository.SaveChangesAsync();

        return BrandProfileMapper.Map(brandStudio);
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
}
