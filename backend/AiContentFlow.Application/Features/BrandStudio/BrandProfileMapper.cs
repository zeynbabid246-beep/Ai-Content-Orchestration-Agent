using System.Text.Json;
using AiContentFlow.Application.Features.BrandStudio.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.BrandStudio;

public static class BrandProfileMapper
{
    public static void ApplyAiPayload(TeamBrandStudio brandStudio, JsonElement root, string websiteUrl, string orgId)
    {
        var parsed = GetObject(root, "parsed_profile") ?? root;
        var enriched = GetObject(root, "enriched_profile") ?? default;
        var visual = GetObject(parsed, "visual_identity") ?? default;
        var voice = enriched.ValueKind == JsonValueKind.Object
            ? GetObject(enriched, "voice_guidelines") ?? default
            : default;

        brandStudio.OrgId = GetString(parsed, "org_id") ?? orgId;
        brandStudio.WebsiteUrl = GetString(parsed, "website_url") ?? websiteUrl;
        brandStudio.BrandName = GetString(parsed, "brand_name") ?? "Imported Brand";
        brandStudio.BrandSummary = GetString(parsed, "brand_summary")
            ?? $"Brand profile imported from {websiteUrl}.";
        brandStudio.Slogan = GetString(parsed, "slogan");
        brandStudio.ValueProposition = GetArray(parsed, "value_proposition");
        brandStudio.ToneOfVoice = GetArray(parsed, "tone_of_voice");
        brandStudio.AudienceSignals = GetArray(parsed, "audience_signals");
        brandStudio.ContentPillars = GetArray(parsed, "content_pillars");
        brandStudio.KeyMessages = GetArray(parsed, "key_messages");
        brandStudio.BusinessInfo = GetString(parsed, "business_info");
        brandStudio.Email = GetString(parsed, "email");

        brandStudio.VisualLogoUrl = GetString(visual, "logo_url");
        brandStudio.VisualFaviconUrl = GetString(visual, "favicon_url");
        brandStudio.VisualPrimaryColors = GetArray(visual, "primary_colors");
        brandStudio.VisualSecondaryColors = GetArray(visual, "secondary_colors");
        brandStudio.VisualFontFamilies = GetArray(visual, "font_families");
        brandStudio.VisualImageUrls = GetArray(visual, "image_urls");
        brandStudio.VisualStyle = GetString(visual, "visual_style");
        brandStudio.VisualHeroText = GetString(visual, "hero_text");
        brandStudio.VisualCtaTexts = GetArray(visual, "cta_texts");
        brandStudio.VisualScreenshotPath = GetString(visual, "screenshot_path");
        brandStudio.VisualRenderMode = GetString(visual, "render_mode");
        brandStudio.VisualHasLogo = GetBool(visual, "has_logo")
            || !string.IsNullOrWhiteSpace(brandStudio.VisualLogoUrl)
            || !string.IsNullOrWhiteSpace(brandStudio.VisualFaviconUrl);
        brandStudio.VisualHasImages = GetBool(visual, "has_images");

        if (enriched.ValueKind == JsonValueKind.Object)
        {
            brandStudio.EnrichedBrandPersonality = GetArray(enriched, "brand_personality");
            brandStudio.EnrichedBrandArchetype = GetString(enriched, "brand_archetype");
            brandStudio.EnrichedPositioningStatement = GetString(enriched, "positioning_statement");
            brandStudio.EnrichedMessagingPriorities = GetArray(enriched, "messaging_priorities");
            brandStudio.EnrichedVisualDirectionNotes = GetString(enriched, "visual_direction_notes");
            brandStudio.EnrichedLinkedInVoice = GetString(enriched, "linkedin_voice");
            brandStudio.EnrichedAdCopyStyle = GetString(enriched, "ad_copy_style");
        }

        if (voice.ValueKind == JsonValueKind.Object)
        {
            brandStudio.VoiceGuidelinesDo = GetArray(voice, "do");
            brandStudio.VoiceGuidelinesDont = GetArray(voice, "dont");
        }

        ApplyDefaultFields(brandStudio);
    }

    public static void ApplyDefaultFields(TeamBrandStudio brandStudio)
    {
        brandStudio.DefaultToneOfVoice = JoinList(brandStudio.ToneOfVoice);
        brandStudio.DefaultTargetAudience = JoinList(brandStudio.AudienceSignals);
        brandStudio.DefaultContentPillars = [.. brandStudio.ContentPillars];
        brandStudio.DefaultMission = brandStudio.EnrichedPositioningStatement;
        brandStudio.DefaultBrandSummary = brandStudio.BrandSummary;
        brandStudio.DefaultCampaignObjective ??= "awareness";
    }

    public static TeamBrandStudioDto Map(TeamBrandStudio brandStudio)
    {
        var latestJob = brandStudio.ImportJobs
            .OrderByDescending(job => job.CreatedAt)
            .ThenByDescending(job => job.Id)
            .FirstOrDefault();

        return new TeamBrandStudioDto(
            brandStudio.Id,
            brandStudio.TeamId,
            MapParsedProfile(brandStudio),
            MapEnrichedProfile(brandStudio),
            MapDefaultConfig(brandStudio),
            brandStudio.CreatedAt,
            brandStudio.UpdatedAt,
            latestJob is null ? null : MapJob(latestJob));
    }

    public static BrandImportJobDto MapJob(BrandImportJob job)
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

    public static void ApplyUpdate(TeamBrandStudio brandStudio, UpdateBrandStudioDto dto)
    {
        if (dto.ParsedProfile is not null)
            ApplyParsedProfile(brandStudio, dto.ParsedProfile);

        if (dto.EnrichedProfile is not null)
            ApplyEnrichedProfile(brandStudio, dto.EnrichedProfile);

        if (dto.DefaultConfig is not null)
            ApplyDefaultConfig(brandStudio, NormalizeDefaultConfig(dto.DefaultConfig));
        else if (dto.ParsedProfile is not null || dto.EnrichedProfile is not null)
            ApplyDefaultFields(brandStudio);
    }

    private static BrandParsedProfileDto MapParsedProfile(TeamBrandStudio brandStudio)
    {
        return new BrandParsedProfileDto(
            brandStudio.OrgId,
            brandStudio.WebsiteUrl,
            brandStudio.BrandName,
            brandStudio.BrandSummary,
            brandStudio.Slogan,
            brandStudio.ValueProposition,
            brandStudio.ToneOfVoice,
            brandStudio.AudienceSignals,
            brandStudio.ContentPillars,
            MapVisualIdentity(brandStudio),
            brandStudio.KeyMessages,
            brandStudio.BusinessInfo,
            brandStudio.Email);
    }

    private static BrandEnrichedProfileDto MapEnrichedProfile(TeamBrandStudio brandStudio)
    {
        return new BrandEnrichedProfileDto(
            brandStudio.EnrichedBrandPersonality,
            brandStudio.EnrichedBrandArchetype,
            brandStudio.EnrichedPositioningStatement,
            new BrandVoiceGuidelinesDto(brandStudio.VoiceGuidelinesDo, brandStudio.VoiceGuidelinesDont),
            brandStudio.EnrichedMessagingPriorities,
            brandStudio.EnrichedVisualDirectionNotes,
            brandStudio.EnrichedLinkedInVoice,
            brandStudio.EnrichedAdCopyStyle,
            brandStudio.OrgId,
            brandStudio.WebsiteUrl);
    }

    private static BrandVisualIdentityDto MapVisualIdentity(TeamBrandStudio brandStudio)
    {
        return new BrandVisualIdentityDto(
            brandStudio.VisualLogoUrl,
            brandStudio.VisualFaviconUrl,
            brandStudio.VisualPrimaryColors,
            brandStudio.VisualSecondaryColors,
            brandStudio.VisualFontFamilies,
            brandStudio.VisualImageUrls,
            brandStudio.VisualStyle,
            brandStudio.VisualHeroText,
            brandStudio.VisualCtaTexts,
            brandStudio.VisualScreenshotPath,
            brandStudio.VisualRenderMode,
            brandStudio.VisualHasLogo,
            brandStudio.VisualHasImages);
    }

    private static BrandStudioDefaultConfigDto MapDefaultConfig(TeamBrandStudio brandStudio)
    {
        return new BrandStudioDefaultConfigDto(
            brandStudio.DefaultToneOfVoice,
            brandStudio.DefaultTargetAudience,
            brandStudio.DefaultContentPillars,
            brandStudio.DefaultMission,
            brandStudio.DefaultBrandSummary,
            brandStudio.DefaultCampaignObjective);
    }

    private static void ApplyParsedProfile(TeamBrandStudio brandStudio, BrandParsedProfileDto profile)
    {
        brandStudio.OrgId = Normalize(profile.OrgId);
        brandStudio.WebsiteUrl = Normalize(profile.WebsiteUrl);
        brandStudio.BrandName = Normalize(profile.BrandName);
        brandStudio.BrandSummary = Normalize(profile.BrandSummary);
        brandStudio.Slogan = Normalize(profile.Slogan);
        brandStudio.ValueProposition = CleanList(profile.ValueProposition);
        brandStudio.ToneOfVoice = CleanList(profile.ToneOfVoice);
        brandStudio.AudienceSignals = CleanList(profile.AudienceSignals);
        brandStudio.ContentPillars = CleanList(profile.ContentPillars);
        brandStudio.KeyMessages = CleanList(profile.KeyMessages);
        brandStudio.BusinessInfo = Normalize(profile.BusinessInfo);
        brandStudio.Email = Normalize(profile.Email);

        if (profile.VisualIdentity is not null)
        {
            var visual = profile.VisualIdentity;
            brandStudio.VisualLogoUrl = Normalize(visual.LogoUrl);
            brandStudio.VisualFaviconUrl = Normalize(visual.FaviconUrl);
            brandStudio.VisualPrimaryColors = CleanList(visual.PrimaryColors);
            brandStudio.VisualSecondaryColors = CleanList(visual.SecondaryColors);
            brandStudio.VisualFontFamilies = CleanList(visual.FontFamilies);
            brandStudio.VisualImageUrls = CleanList(visual.ImageUrls);
            brandStudio.VisualStyle = Normalize(visual.VisualStyle);
            brandStudio.VisualHeroText = Normalize(visual.HeroText);
            brandStudio.VisualCtaTexts = CleanList(visual.CtaTexts);
            brandStudio.VisualScreenshotPath = Normalize(visual.ScreenshotPath);
            brandStudio.VisualRenderMode = Normalize(visual.RenderMode);
            brandStudio.VisualHasLogo = visual.HasLogo;
            brandStudio.VisualHasImages = visual.HasImages;
        }
    }

    private static void ApplyEnrichedProfile(TeamBrandStudio brandStudio, BrandEnrichedProfileDto profile)
    {
        brandStudio.EnrichedBrandPersonality = CleanList(profile.BrandPersonality);
        brandStudio.EnrichedBrandArchetype = Normalize(profile.BrandArchetype);
        brandStudio.EnrichedPositioningStatement = Normalize(profile.PositioningStatement);
        brandStudio.EnrichedMessagingPriorities = CleanList(profile.MessagingPriorities);
        brandStudio.EnrichedVisualDirectionNotes = Normalize(profile.VisualDirectionNotes);
        brandStudio.EnrichedLinkedInVoice = Normalize(profile.LinkedInVoice);
        brandStudio.EnrichedAdCopyStyle = Normalize(profile.AdCopyStyle);

        if (profile.VoiceGuidelines is not null)
        {
            brandStudio.VoiceGuidelinesDo = CleanList(profile.VoiceGuidelines.Do);
            brandStudio.VoiceGuidelinesDont = CleanList(profile.VoiceGuidelines.Dont);
        }
    }

    private static void ApplyDefaultConfig(TeamBrandStudio brandStudio, BrandStudioDefaultConfigDto defaults)
    {
        brandStudio.DefaultToneOfVoice = defaults.ToneOfVoice;
        brandStudio.DefaultTargetAudience = defaults.TargetAudience;
        brandStudio.DefaultContentPillars = CleanList(defaults.ContentPillars);
        brandStudio.DefaultMission = defaults.Mission;
        brandStudio.DefaultBrandSummary = defaults.BrandSummary;
        brandStudio.DefaultCampaignObjective = defaults.PreferredCampaignObjective;
    }

    private static BrandStudioDefaultConfigDto NormalizeDefaultConfig(BrandStudioDefaultConfigDto dto)
    {
        return dto with
        {
            ToneOfVoice = Normalize(dto.ToneOfVoice),
            TargetAudience = Normalize(dto.TargetAudience),
            ContentPillars = CleanList(dto.ContentPillars),
            Mission = Normalize(dto.Mission),
            BrandSummary = Normalize(dto.BrandSummary),
            PreferredCampaignObjective = Normalize(dto.PreferredCampaignObjective)
        };
    }

    private static JsonElement? GetObject(JsonElement payload, string key)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty(key, out var value))
            return null;

        return value.ValueKind == JsonValueKind.Object ? value : null;
    }

    private static string? GetString(JsonElement payload, string key)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty(key, out var value))
            return null;

        return value.ValueKind == JsonValueKind.String ? value.GetString() : value.ToString();
    }

    private static bool GetBool(JsonElement payload, string key)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty(key, out var value))
            return false;

        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.String => bool.TryParse(value.GetString(), out var parsed) && parsed,
            _ => false
        };
    }

    private static List<string> GetArray(JsonElement payload, string key)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty(key, out var value) || value.ValueKind != JsonValueKind.Array)
            return [];

        return value.EnumerateArray()
            .Select(item => item.ValueKind == JsonValueKind.String ? item.GetString() ?? string.Empty : item.ToString())
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .ToList();
    }

    private static List<string> CleanList(IReadOnlyList<string>? values)
    {
        if (values is null || values.Count == 0)
            return [];

        return values
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string? JoinList(IReadOnlyList<string> values)
    {
        return values.Count == 0 ? null : string.Join(", ", values);
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
