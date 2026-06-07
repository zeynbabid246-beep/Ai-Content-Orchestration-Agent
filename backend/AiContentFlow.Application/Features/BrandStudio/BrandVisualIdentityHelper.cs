using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.BrandStudio;

public static class BrandVisualIdentityHelper
{
    /// <summary>
    /// Primary brand mark for creatives: scraped logo first, favicon fallback.
    /// </summary>
    public static string? ResolvePrimaryLogoUrl(TeamBrandStudio? brandStudio)
    {
        if (brandStudio is null)
            return null;

        if (!string.IsNullOrWhiteSpace(brandStudio.VisualLogoUrl))
            return brandStudio.VisualLogoUrl.Trim();

        if (!string.IsNullOrWhiteSpace(brandStudio.VisualFaviconUrl))
            return brandStudio.VisualFaviconUrl.Trim();

        return null;
    }

    public static bool HasPrimaryBrandMark(TeamBrandStudio? brandStudio)
        => !string.IsNullOrWhiteSpace(ResolvePrimaryLogoUrl(brandStudio));

    public static object BuildVisualIdentityPayload(TeamBrandStudio? brandStudio)
    {
        if (brandStudio is null)
            return new { };

        var primaryLogoUrl = ResolvePrimaryLogoUrl(brandStudio) ?? string.Empty;

        return new
        {
            logo_url = primaryLogoUrl,
            favicon_url = brandStudio.VisualFaviconUrl ?? string.Empty,
            primary_colors = brandStudio.VisualPrimaryColors,
            secondary_colors = brandStudio.VisualSecondaryColors,
            font_families = brandStudio.VisualFontFamilies,
            visual_style = brandStudio.VisualStyle ?? string.Empty,
            image_urls = brandStudio.VisualImageUrls,
            has_logo = BrandVisualIdentityHelper.HasPrimaryBrandMark(brandStudio),
            has_images = brandStudio.VisualHasImages || brandStudio.VisualImageUrls.Count > 0
        };
    }
}
