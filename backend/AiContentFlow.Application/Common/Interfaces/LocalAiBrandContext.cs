namespace AiContentFlow.Application.Common.Interfaces;

public record LocalAiBrandContext(
    string? BrandName,
    string? WebsiteUrl,
    string? Slogan,
    string? Archetype,
    IReadOnlyList<string>? ToneOfVoice,
    IReadOnlyList<string>? AudienceSignals,
    IReadOnlyList<string>? ContentPillars,
    string? BrandSummary);
