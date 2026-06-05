using AiContentFlow.Application.Common.Publishing;
using Xunit;

namespace AiContentFlow.Application.Tests.Common.Publishing;

public class VariantContentMergeTests
{
    [Fact]
    public void MergePostImageIntoContentJson_AddsImageWhenVariantMissing()
    {
        var merged = VariantContentMerge.MergePostImageIntoContentJson(
            """{"text":"Hello","platform":"Instagram"}""",
            "https://cdn.example.com/photo.jpg");

        Assert.True(VariantContentMerge.HasPublishableImage(merged, null));
        Assert.Contains("photo.jpg", merged);
    }

    [Fact]
    public void MergePostImageIntoContentJson_KeepsExistingVariantImage()
    {
        var original = """{"text":"Hi","imageUrl":"https://cdn.example.com/a.png"}""";
        var merged = VariantContentMerge.MergePostImageIntoContentJson(
            original,
            "https://cdn.example.com/b.png");

        Assert.Equal(original, merged);
    }

    [Fact]
    public void HasPublishableImage_UsesPostImageWhenVariantEmpty()
    {
        Assert.True(VariantContentMerge.HasPublishableImage(
            """{"text":"caption"}""",
            "https://cdn.example.com/post.png"));
    }
}
