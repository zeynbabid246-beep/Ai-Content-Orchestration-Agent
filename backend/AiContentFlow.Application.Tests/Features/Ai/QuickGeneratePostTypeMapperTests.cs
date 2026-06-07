using AiContentFlow.Application.Features.Ai;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Ai;

public class QuickGeneratePostTypeMapperTests
{
    [Theory]
    [InlineData(QuickGeneratePostType.TextOnly, "Text Post", "text_post", false)]
    [InlineData(QuickGeneratePostType.StaticImage, "Static Image", "poster_post", true)]
    [InlineData(QuickGeneratePostType.Infographic, "Infographic", "infographic_post", true)]
    [InlineData(QuickGeneratePostType.Carousel, "Carousel", "carousel_post", false)]
    public void Resolve_MapsPostTypeMetadata(
        QuickGeneratePostType postType,
        string expectedContentType,
        string expectedInternalType,
        bool expectedNeedsCreative)
    {
        var metadata = QuickGeneratePostTypeMapper.Resolve(postType);

        Assert.Equal(expectedContentType, metadata.ContentType);
        Assert.Equal(expectedInternalType, metadata.InternalType);
        Assert.Equal(expectedNeedsCreative, metadata.NeedsCreative);
    }

    [Theory]
    [InlineData(QuickGeneratePostType.TextOnly, false)]
    [InlineData(QuickGeneratePostType.StaticImage, true)]
    [InlineData(QuickGeneratePostType.Infographic, true)]
    [InlineData(QuickGeneratePostType.Carousel, true)]
    public void RequiresCreativeGeneration_ReturnsExpected(QuickGeneratePostType postType, bool expected)
    {
        Assert.Equal(expected, QuickGeneratePostTypeMapper.RequiresCreativeGeneration(postType));
    }
}
