using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.BrandStudio;

public class BrandImportProcessor : IBrandImportProcessor
{
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly ILocalAiBackendClient _localAiBackendClient;

    public BrandImportProcessor(
        IBrandStudioRepository brandStudioRepository,
        ILocalAiBackendClient localAiBackendClient)
    {
        _brandStudioRepository = brandStudioRepository;
        _localAiBackendClient = localAiBackendClient;
    }

    public async Task ProcessAsync(int importJobId, CancellationToken cancellationToken = default)
    {
        var job = await _brandStudioRepository.GetJobByIdForProcessingAsync(importJobId)
            ?? throw new KeyNotFoundException("Brand import job not found");

        if (job.Status != BrandImportJobStatus.Queued && job.Status != BrandImportJobStatus.Processing)
        {
            return;
        }

        var utcNow = DateTime.UtcNow;
        job.MarkProcessing(utcNow);
        await _brandStudioRepository.SaveChangesAsync();

        try
        {
            var brandStudio = job.TeamBrandStudio
                ?? throw new InvalidOperationException("Brand Studio profile missing for import job");

            var correlationId = Guid.NewGuid().ToString("N");
            var orgId = $"team_{job.TeamId:N}";
            var payload = await _localAiBackendClient.AnalyzeBrandAsync(orgId, job.WebsiteUrl, correlationId, cancellationToken);

            BrandProfileMapper.ApplyAiPayload(brandStudio, payload, job.WebsiteUrl, orgId);
            brandStudio.UpdatedAt = DateTime.UtcNow;

            job.MarkCompleted(DateTime.UtcNow, JsonSerializer.Serialize(payload));

            await _brandStudioRepository.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            job.MarkFailed(ex.Message, DateTime.UtcNow);
            await _brandStudioRepository.SaveChangesAsync();
            throw;
        }
    }
}
