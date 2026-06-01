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

public record BrandVisualIdentityDto(
    string? LogoUrl,
    string? FaviconUrl,
    IReadOnlyList<string> PrimaryColors,
    IReadOnlyList<string> SecondaryColors,
    IReadOnlyList<string> FontFamilies,
    IReadOnlyList<string> ImageUrls,
    string? VisualStyle,
    string? HeroText,
    IReadOnlyList<string> CtaTexts,
    string? ScreenshotPath,
    string? RenderMode,
    bool HasLogo,
    bool HasImages);

public record BrandVoiceGuidelinesDto(
    IReadOnlyList<string> Do,
    IReadOnlyList<string> Dont);

public record BrandParsedProfileDto(
    string? OrgId,
    string? WebsiteUrl,
    string? BrandName,
    string? BrandSummary,
    string? Slogan,
    IReadOnlyList<string> ValueProposition,
    IReadOnlyList<string> ToneOfVoice,
    IReadOnlyList<string> AudienceSignals,
    IReadOnlyList<string> ContentPillars,
    BrandVisualIdentityDto VisualIdentity,
    IReadOnlyList<string> KeyMessages,
    string? BusinessInfo,
    string? Email);

public record BrandEnrichedProfileDto(
    IReadOnlyList<string> BrandPersonality,
    string? BrandArchetype,
    string? PositioningStatement,
    BrandVoiceGuidelinesDto VoiceGuidelines,
    IReadOnlyList<string> MessagingPriorities,
    string? VisualDirectionNotes,
    string? LinkedInVoice,
    string? AdCopyStyle,
    string? OrgId,
    string? WebsiteUrl);

public record BrandStudioDefaultConfigDto(
    string? ToneOfVoice,
    string? TargetAudience,
    IReadOnlyList<string> ContentPillars,
    string? Mission,
    string? BrandSummary,
    string? PreferredCampaignObjective);

public record UpdateBrandStudioDto(
    BrandParsedProfileDto? ParsedProfile,
    BrandEnrichedProfileDto? EnrichedProfile,
    BrandStudioDefaultConfigDto? DefaultConfig);

public record TeamBrandStudioDto(
    int Id,
    Guid TeamId,
    BrandParsedProfileDto ParsedProfile,
    BrandEnrichedProfileDto EnrichedProfile,
    BrandStudioDefaultConfigDto DefaultConfig,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    BrandImportJobDto? LatestImportJob);

public record BrandStudioSnapshotDto(TeamBrandStudioDto? BrandStudio);

public record CreateBrandImportResponseDto(
    TeamBrandStudioDto BrandStudio,
    BrandImportJobDto Job);
