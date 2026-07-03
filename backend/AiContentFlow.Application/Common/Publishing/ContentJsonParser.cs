using System.Text.Json;

namespace AiContentFlow.Application.Common.Publishing;

/// <summary>
/// Extracts publish-ready fields from a PostVariant's ContentJson regardless of
/// whether it was written by the normalized frontend builder or came straight from
/// the AI pipeline (which wraps content in a "preview"/"generated" envelope).
/// </summary>
public static class ContentJsonParser
{
    public static (string? Text, string? ImageUrl) Extract(string? contentJson)
    {
        if (string.IsNullOrWhiteSpace(contentJson))
            return (null, null);

        try
        {
            var root = JsonSerializer.Deserialize<JsonElement>(contentJson);

            // 1. Standard normalized format: { "text": "...", "imageUrl": "..." }
            if (root.TryGetProperty("text", out var textProp))
            {
                var text = textProp.GetString()?.Trim();
                string? imageUrl = null;
                if (root.TryGetProperty("imageUrl", out var imgProp))
                    imageUrl = imgProp.GetString();
                return (text, imageUrl);
            }

            // 2. AI pipeline format: { "preview": "...", "generated": { "text": "..." } }
            if (root.TryGetProperty("generated", out var generatedProp))
            {
                string? text = null;
                if (generatedProp.TryGetProperty("text", out var genTextProp))
                    text = genTextProp.GetString()?.Trim();

                // Fallback to top-level "preview" string if generated.text is empty
                if (string.IsNullOrWhiteSpace(text) && root.TryGetProperty("preview", out var previewProp))
                    text = previewProp.GetString()?.Trim();

                string? imageUrl = null;
                if (root.TryGetProperty("imageUrl", out var imgProp))
                    imageUrl = imgProp.GetString();

                return (text, imageUrl);
            }

            // 3. Bare "preview" key (partial AI envelope)
            if (root.TryGetProperty("preview", out var barePreviewProp))
            {
                var text = barePreviewProp.GetString()?.Trim();
                return (text, null);
            }
        }
        catch
        {
            // Not valid JSON — treat the raw string as plain text
            return (contentJson.Trim(), null);
        }

        return (null, null);
    }
}
