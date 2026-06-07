using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Domain.Models;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.BrandStudio;

public class BrandVisualIdentityHelperTests
{
    [Fact]
    public void ResolvePrimaryLogoUrl_PrefersLogoOverFavicon()
    {
        var studio = new TeamBrandStudio
        {
            VisualLogoUrl = "https://example.com/logo.png",
            VisualFaviconUrl = "https://example.com/favicon.ico"
        };

        Assert.Equal("https://example.com/logo.png", BrandVisualIdentityHelper.ResolvePrimaryLogoUrl(studio));
    }

    [Fact]
    public void ResolvePrimaryLogoUrl_FallsBackToFaviconWhenLogoMissing()
    {
        var studio = new TeamBrandStudio
        {
            VisualLogoUrl = null,
            VisualFaviconUrl = "https://example.com/favicon.ico"
        };

        Assert.Equal("https://example.com/favicon.ico", BrandVisualIdentityHelper.ResolvePrimaryLogoUrl(studio));
    }

    [Fact]
    public void HasPrimaryBrandMark_IsTrueWhenOnlyFaviconExists()
    {
        var studio = new TeamBrandStudio { VisualFaviconUrl = "https://example.com/favicon.ico" };

        Assert.True(BrandVisualIdentityHelper.HasPrimaryBrandMark(studio));
    }
}
