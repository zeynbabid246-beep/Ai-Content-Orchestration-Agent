using System.Text.Json;
using System.Text.Json.Nodes;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Ai;

internal static class CreativeContentJsonMapper
{
    public static bool IsCarouselMode(JsonObject root, ContentType contentType)
    {
        var aiFormat = GetString(root, "aiFormat") ?? GetString(root, "ai_format");
        var plannerType = GetString(root, "plannerContentType") ?? GetString(root, "planner_content_type");
        if (ContainsCarouselHint(aiFormat) || ContainsCarouselHint(plannerType))
            return true;

        var generated = GetGeneratedObject(root);
        if (generated is null)
            return false;

        if (ContainsCarouselHint(GetString(generated, "type"))
            || ContainsCarouselHint(GetString(generated, "content_type"))
            || ContainsCarouselHint(GetString(generated, "format")))
        {
            return true;
        }

        if (generated["slides"] is JsonArray slides && slides.Count > 0)
            return true;

        return contentType == ContentType.InstagramPost
               && generated["slides"] is JsonArray instagramSlides
               && instagramSlides.Count > 0;
    }

    public static Dictionary<string, object?> BuildPostContent(JsonObject root, string? titleFallback)
    {
        var generated = GetGeneratedObject(root) ?? root;
        var postContent = new Dictionary<string, object?>();

        CopyIfPresent(generated, postContent, "topic");
        CopyIfPresent(generated, postContent, "title");
        CopyIfPresent(generated, postContent, "intro");
        CopyIfPresent(generated, postContent, "hook");
        CopyIfPresent(generated, postContent, "body");
        CopyIfPresent(generated, postContent, "cta");
        CopyIfPresent(generated, postContent, "text");
        CopyIfPresent(generated, postContent, "hashtags");
        CopyIfPresent(generated, postContent, "sections");
        CopyIfPresent(generated, postContent, "slides");

        if (!postContent.ContainsKey("title") && !string.IsNullOrWhiteSpace(titleFallback))
            postContent["title"] = titleFallback;

        if (!postContent.ContainsKey("text"))
        {
            var preview = GetString(root, "preview");
            if (!string.IsNullOrWhiteSpace(preview))
                postContent["text"] = preview;
        }

        if (postContent.Count == 0)
            throw new InvalidOperationException("Post has no usable text content for creative generation.");

        return postContent;
    }

    public static string MergeCreativeAssets(
        string contentJson,
        string platformKey,
        string? posterUrl,
        IReadOnlyList<string> carouselAssets,
        string? creativeError)
    {
        var root = ParseRoot(contentJson);
        var generated = GetOrCreateGeneratedObject(root);

        if (!string.IsNullOrWhiteSpace(posterUrl))
        {
            generated["poster_url"] = posterUrl;
            generated["creative_asset_url"] = posterUrl;
        }

        if (carouselAssets.Count > 0)
        {
            generated["carousel_assets"] = new JsonArray(
                carouselAssets.Select(url => JsonValue.Create(url)).ToArray());
            if (string.IsNullOrWhiteSpace(posterUrl))
            {
                generated["poster_url"] = carouselAssets[0];
                generated["creative_asset_url"] = carouselAssets[0];
            }
        }

        if (!string.IsNullOrWhiteSpace(creativeError))
            generated["creative_error"] = creativeError;
        else
            generated.Remove("creative_error");

        var platformAssets = generated["platform_assets"] as JsonObject ?? new JsonObject();
        var platformEntry = new JsonObject();
        if (!string.IsNullOrWhiteSpace(posterUrl))
        {
            platformEntry["poster_url"] = posterUrl;
            platformEntry["creative_asset_url"] = posterUrl;
        }

        if (carouselAssets.Count > 0)
        {
            platformEntry["carousel_assets"] = new JsonArray(
                carouselAssets.Select(url => JsonValue.Create(url)).ToArray());
        }

        platformAssets[platformKey] = platformEntry;
        generated["platform_assets"] = platformAssets;
        root["generated"] = generated;

        return root.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
    }

    public static string ResolveVisualDirection(JsonObject root, string? overrideDirection)
    {
        if (!string.IsNullOrWhiteSpace(overrideDirection))
            return overrideDirection.Trim();

        var generated = GetGeneratedObject(root);
        if (generated is null)
            return string.Empty;

        return GetString(generated, "visual_direction")
               ?? GetString(generated, "creative_direction")
               ?? GetString(generated, "visualDirection")
               ?? string.Empty;
    }

    public static string ResolveContentTypeLabel(JsonObject root, bool isCarousel)
    {
        if (isCarousel)
            return "Carousel";

        var generated = GetGeneratedObject(root);
        var raw = GetString(generated, "content_type")
                  ?? GetString(generated, "type")
                  ?? GetString(root, "plannerContentType")
                  ?? "Static Image";

        if (ContainsCarouselHint(raw))
            return "Carousel";

        if (raw.Contains("infographic", StringComparison.OrdinalIgnoreCase))
            return "Infographic";

        return "Static Image";
    }

    private static JsonObject ParseRoot(string contentJson)
    {
        if (string.IsNullOrWhiteSpace(contentJson))
            return new JsonObject();

        try
        {
            return JsonNode.Parse(contentJson) as JsonObject ?? new JsonObject();
        }
        catch
        {
            return new JsonObject { ["text"] = contentJson.Trim() };
        }
    }

    private static JsonObject? GetGeneratedObject(JsonObject root)
        => root["generated"] as JsonObject;

    private static JsonObject GetOrCreateGeneratedObject(JsonObject root)
    {
        if (root["generated"] is JsonObject generated)
            return generated;

        if (root.ContainsKey("text") || root.ContainsKey("slides"))
        {
            var moved = new JsonObject();
            foreach (var property in root.ToList())
            {
                if (property.Key is "source" or "preview" or "plannerContentType" or "aiFormat")
                    continue;

                moved[property.Key] = property.Value?.DeepClone();
                root.Remove(property.Key);
            }

            root["generated"] = moved;
            root["source"] ??= "aicontentflow_post_editor";
            return moved;
        }

        var created = new JsonObject();
        root["generated"] = created;
        root["source"] ??= "aicontentflow_post_editor";
        return created;
    }

    private static void CopyIfPresent(JsonObject source, Dictionary<string, object?> target, string propertyName)
    {
        if (source[propertyName] is null)
            return;

        target[propertyName] = JsonSerializer.Deserialize<object>(source[propertyName]!.ToJsonString());
    }

    private static string? GetString(JsonObject? node, string propertyName)
    {
        if (node is null || node[propertyName] is not JsonValue value)
            return null;

        return value.GetValue<string?>();
    }

    private static bool ContainsCarouselHint(string? value)
        => !string.IsNullOrWhiteSpace(value)
           && value.Contains("carousel", StringComparison.OrdinalIgnoreCase);
}
