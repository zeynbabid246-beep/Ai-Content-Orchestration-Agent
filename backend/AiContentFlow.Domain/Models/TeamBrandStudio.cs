namespace AiContentFlow.Domain.Models;

public class TeamBrandStudio
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }

    public string? OrgId { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? BrandName { get; set; }
    public string? BrandSummary { get; set; }
    public string? Slogan { get; set; }
    public List<string> ValueProposition { get; set; } = [];
    public List<string> ToneOfVoice { get; set; } = [];
    public List<string> AudienceSignals { get; set; } = [];
    public List<string> ContentPillars { get; set; } = [];
    public List<string> KeyMessages { get; set; } = [];
    public string? BusinessInfo { get; set; }
    public string? Email { get; set; }

    public string? VisualLogoUrl { get; set; }
    public string? VisualFaviconUrl { get; set; }
    public List<string> VisualPrimaryColors { get; set; } = [];
    public List<string> VisualSecondaryColors { get; set; } = [];
    public List<string> VisualFontFamilies { get; set; } = [];
    public List<string> VisualImageUrls { get; set; } = [];
    public string? VisualStyle { get; set; }
    public string? VisualHeroText { get; set; }
    public List<string> VisualCtaTexts { get; set; } = [];
    public string? VisualScreenshotPath { get; set; }
    public string? VisualRenderMode { get; set; }
    public bool VisualHasLogo { get; set; }
    public bool VisualHasImages { get; set; }

    public List<string> EnrichedBrandPersonality { get; set; } = [];
    public string? EnrichedBrandArchetype { get; set; }
    public string? EnrichedPositioningStatement { get; set; }
    public List<string> VoiceGuidelinesDo { get; set; } = [];
    public List<string> VoiceGuidelinesDont { get; set; } = [];
    public List<string> EnrichedMessagingPriorities { get; set; } = [];
    public string? EnrichedVisualDirectionNotes { get; set; }
    public string? EnrichedLinkedInVoice { get; set; }
    public string? EnrichedAdCopyStyle { get; set; }

    public string? DefaultToneOfVoice { get; set; }
    public string? DefaultTargetAudience { get; set; }
    public List<string> DefaultContentPillars { get; set; } = [];
    public string? DefaultMission { get; set; }
    public string? DefaultBrandSummary { get; set; }
    public string? DefaultCampaignObjective { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<BrandImportJob> ImportJobs { get; set; } = [];
}
