namespace AiContentFlow.Application.Features.Ai;

public enum QuickGeneratePostType
{
    TextOnly,
    StaticImage,
    Infographic,
    Carousel
}

public record QuickGeneratePostTypeMetadata(
    string ContentType,
    string PostType,
    string InternalType,
    bool NeedsCreative);

public static class QuickGeneratePostTypeMapper
{
    public static QuickGeneratePostTypeMetadata Resolve(QuickGeneratePostType postType)
    {
        return postType switch
        {
            QuickGeneratePostType.StaticImage => new(
                "Static Image",
                "Post avec affiche",
                "poster_post",
                NeedsCreative: true),
            QuickGeneratePostType.Infographic => new(
                "Infographic",
                "Infographie",
                "infographic_post",
                NeedsCreative: true),
            QuickGeneratePostType.Carousel => new(
                "Carousel",
                "Carousel",
                "carousel_post",
                NeedsCreative: false),
            _ => new(
                "Text Post",
                "Statut textuel",
                "text_post",
                NeedsCreative: false)
        };
    }

    public static bool RequiresCreativeGeneration(QuickGeneratePostType postType)
        => postType is QuickGeneratePostType.StaticImage
            or QuickGeneratePostType.Infographic
            or QuickGeneratePostType.Carousel;
}
