using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Ai;

/// <summary>
/// Builds the FastAPI <c>ManualBrandCreateRequest</c> body for POST /api/brand/manual.
/// </summary>
internal static class LocalAiManualBrandMapper
{
    public static object ToApiBody(TeamBrandStudio studio, string orgId)
    {
        var primaryColor = studio.VisualPrimaryColors.FirstOrDefault() ?? string.Empty;
        var secondaryColor = studio.VisualSecondaryColors.FirstOrDefault() ?? string.Empty;
        var typography = studio.VisualFontFamilies.FirstOrDefault() ?? string.Empty;
        var brandSummary = studio.BrandSummary ?? studio.DefaultBrandSummary ?? string.Empty;
        var archetype = studio.EnrichedBrandArchetype ?? string.Empty;

        var visualIdentity = new Dictionary<string, object?>
        {
            ["logo_url"] = BrandVisualIdentityHelper.ResolvePrimaryLogoUrl(studio) ?? string.Empty,
            ["favicon_url"] = studio.VisualFaviconUrl ?? string.Empty,
            ["primary_colors"] = studio.VisualPrimaryColors,
            ["secondary_colors"] = studio.VisualSecondaryColors,
            ["font_families"] = studio.VisualFontFamilies,
            ["image_urls"] = studio.VisualImageUrls,
            ["visual_style"] = studio.VisualStyle ?? string.Empty,
            ["hero_text"] = studio.VisualHeroText ?? string.Empty,
            ["cta_texts"] = studio.VisualCtaTexts,
            ["screenshot_path"] = studio.VisualScreenshotPath ?? string.Empty,
            ["render_mode"] = studio.VisualRenderMode ?? "sync",
            ["has_logo"] = BrandVisualIdentityHelper.HasPrimaryBrandMark(studio),
            ["has_images"] = studio.VisualHasImages,
        };

        var parsedProfile = new Dictionary<string, object?>
        {
            ["org_id"] = orgId,
            ["brand_name"] = studio.BrandName ?? string.Empty,
            ["website_url"] = studio.WebsiteUrl ?? string.Empty,
            ["slogan"] = studio.Slogan ?? string.Empty,
            ["archetype"] = archetype,
            ["tone_of_voice"] = studio.ToneOfVoice,
            ["audience_signals"] = studio.AudienceSignals,
            ["content_pillars"] = studio.ContentPillars,
            ["brand_summary"] = brandSummary,
            ["value_proposition"] = studio.ValueProposition,
            ["key_messages"] = studio.KeyMessages,
            ["business_info"] = studio.BusinessInfo ?? string.Empty,
            ["email"] = studio.Email ?? string.Empty,
            ["visual_identity"] = visualIdentity,
        };

        var enrichedProfile = new Dictionary<string, object?>
        {
            ["org_id"] = orgId,
            ["website_url"] = studio.WebsiteUrl ?? string.Empty,
            ["brand_personality"] = studio.EnrichedBrandPersonality,
            ["brand_archetype"] = archetype,
            ["positioning_statement"] = studio.EnrichedPositioningStatement ?? string.Empty,
            ["voice_guidelines"] = new Dictionary<string, object?>
            {
                ["do"] = studio.VoiceGuidelinesDo,
                ["dont"] = studio.VoiceGuidelinesDont,
            },
            ["messaging_priorities"] = studio.EnrichedMessagingPriorities,
            ["visual_direction_notes"] = studio.EnrichedVisualDirectionNotes ?? string.Empty,
            ["linkedin_voice"] = studio.EnrichedLinkedInVoice ?? string.Empty,
            ["ad_copy_style"] = studio.EnrichedAdCopyStyle ?? string.Empty,
        };

        var rawPayload = new Dictionary<string, object?>
        {
            ["source_type"] = "aicontentflow_sync",
            ["team_brand_studio_id"] = studio.Id,
            ["parsed_profile"] = parsedProfile,
            ["enriched_profile"] = enrichedProfile,
        };

        return new
        {
            org_id = orgId,
            brand_name = studio.BrandName ?? "Brand",
            website_url = studio.WebsiteUrl ?? string.Empty,
            slogan = studio.Slogan ?? string.Empty,
            archetype,
            tone_of_voice = studio.ToneOfVoice,
            audience_signals = studio.AudienceSignals,
            content_pillars = studio.ContentPillars,
            brand_summary = brandSummary,
            primary_color = primaryColor,
            secondary_color = secondaryColor,
            typography,
            email = studio.Email ?? string.Empty,
            business_info = studio.BusinessInfo ?? string.Empty,
            raw_payload = rawPayload,
            parsed_profile = parsedProfile,
        };
    }
}
