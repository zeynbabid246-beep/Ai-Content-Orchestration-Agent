using System.Text.Json;
using System.Text.Json.Nodes;

namespace AiContentFlow.Application.Common.Publishing;

/// <summary>
/// Campaign posts store shared media on <see cref="Domain.Models.ContentPost.ImageUrl"/>;
/// publishers read <c>imageUrl</c> from variant <c>contentJson</c>. Merge before publish/validate.
/// </summary>
public static class VariantContentMerge
{
    public static string MergePostImageIntoContentJson(string contentJson, string? postImageUrl)
    {
        if (string.IsNullOrWhiteSpace(postImageUrl))
            return contentJson;

        if (TryGetImageUrlFromContentJson(contentJson, out var existing)
            && !string.IsNullOrWhiteSpace(existing))
        {
            return contentJson;
        }

        return SetImageUrlInContentJson(contentJson, postImageUrl);
    }

    public static bool HasPublishableImage(string contentJson, string? postImageUrl)
    {
        if (TryGetImageUrlFromContentJson(contentJson, out var fromVariant)
            && !string.IsNullOrWhiteSpace(fromVariant))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(postImageUrl);
    }

    public static bool TryGetImageUrlFromContentJson(string contentJson, out string? imageUrl)
    {
        imageUrl = null;
        if (string.IsNullOrWhiteSpace(contentJson))
            return false;

        try
        {
            using var doc = JsonDocument.Parse(contentJson);
            if (doc.RootElement.TryGetProperty("imageUrl", out var prop)
                && prop.ValueKind == JsonValueKind.String)
            {
                imageUrl = prop.GetString();
                return true;
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static string SetImageUrlInContentJson(string contentJson, string postImageUrl)
    {
        if (string.IsNullOrWhiteSpace(contentJson))
        {
            return JsonSerializer.Serialize(new { imageUrl = postImageUrl });
        }

        try
        {
            var node = JsonNode.Parse(contentJson);
            if (node is JsonObject obj)
            {
                obj["imageUrl"] = postImageUrl;
                return obj.ToJsonString();
            }
        }
        catch (JsonException)
        {
            // fall through
        }

        return JsonSerializer.Serialize(new
        {
            text = contentJson,
            imageUrl = postImageUrl
        });
    }
}
