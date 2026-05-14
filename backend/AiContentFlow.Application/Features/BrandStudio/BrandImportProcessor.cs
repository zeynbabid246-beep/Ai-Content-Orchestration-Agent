using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.BrandStudio;

public class BrandImportProcessor : IBrandImportProcessor
{
    private readonly IBrandStudioRepository _brandStudioRepository;

    public BrandImportProcessor(IBrandStudioRepository brandStudioRepository)
    {
        _brandStudioRepository = brandStudioRepository;
    }

    public async Task ProcessAsync(int importJobId, CancellationToken cancellationToken = default)
    {
        var job = await _brandStudioRepository.GetJobByIdForProcessingAsync(importJobId)
            ?? throw new KeyNotFoundException("Brand import job not found");

        var utcNow = DateTime.UtcNow;
        job.MarkProcessing(utcNow);
        await _brandStudioRepository.SaveChangesAsync();

        await Task.Delay(TimeSpan.FromSeconds(4), cancellationToken);

        var brandStudio = job.TeamBrandStudio
            ?? throw new InvalidOperationException("Brand Studio profile missing for import job");

        var host = new Uri(job.WebsiteUrl).Host.Replace("www.", string.Empty);
        var companyName = BuildCompanyName(host);
        var keywords = new[] { "brand context", "content operations", "team intelligence" };

        brandStudio.WebsiteUrl = job.WebsiteUrl;
        brandStudio.CompanyName = companyName;
        brandStudio.Description = $"{companyName} brand profile imported from the company website. AI extraction is not enabled yet.";
        brandStudio.Mission = "Placeholder mission pending AI extraction";
        brandStudio.TargetAudience = "Placeholder audience pending AI extraction";
        brandStudio.ToneOfVoice = "Professional, clear, trustworthy";
        brandStudio.KeywordsJson = JsonSerializer.Serialize(keywords);
        brandStudio.UpdatedAt = DateTime.UtcNow;

        job.MarkCompleted(DateTime.UtcNow, JsonSerializer.Serialize(new
        {
            source = job.WebsiteUrl,
            extractionMode = "mock",
            note = "Real scraping and AI extraction are intentionally not implemented yet."
        }));

        await _brandStudioRepository.SaveChangesAsync();
    }

    private static string BuildCompanyName(string host)
    {
        var firstSegment = host.Split('.', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "Company";
        return string.Join(' ', firstSegment.Split('-', StringSplitOptions.RemoveEmptyEntries))
            .Trim();
    }
}
