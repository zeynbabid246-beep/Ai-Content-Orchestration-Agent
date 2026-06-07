namespace AiContentFlow.Application.Common.Interfaces;

public record LocalAiBrandContext(
    string? BrandName,
    string? WebsiteUrl,
    string? Slogan,
    string? Archetype,
    IReadOnlyList<string>? ToneOfVoice,
    IReadOnlyList<string>? AudienceSignals,
    IReadOnlyList<string>? ContentPillars,
    string? BrandSummary,
    string? LogoUrl = null,
    string? FaviconUrl = null,
    IReadOnlyList<string>? PrimaryColors = null,
    IReadOnlyList<string>? SecondaryColors = null,
    IReadOnlyList<string>? FontFamilies = null,
    string? VisualStyle = null,
    IReadOnlyList<string>? ImageUrls = null,
    bool HasLogo = false);
