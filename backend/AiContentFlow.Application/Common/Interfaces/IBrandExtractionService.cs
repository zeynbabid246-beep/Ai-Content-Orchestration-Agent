namespace AiContentFlow.Application.Common.Interfaces;

public record BrandExtractionResult(
    string CompanyName,
    string Description,
    string Mission,
    string TargetAudience,
    string ToneOfVoice,
    IReadOnlyList<string> Keywords,
    IReadOnlyList<string> Products,
    IReadOnlyList<string> Services);

public interface IBrandExtractionService
{
    Task<BrandExtractionResult> ExtractAsync(
        string websiteUrl,
        string html,
        CancellationToken cancellationToken = default);
}
