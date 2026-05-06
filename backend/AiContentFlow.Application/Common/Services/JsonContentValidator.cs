using System.Text.Json;

namespace AiContentFlow.Application.Common.Services;

public static class JsonContentValidator
{
    public static string Normalize(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw new InvalidOperationException("ContentJson is required");

        try
        {
            using var document = JsonDocument.Parse(json);
            return JsonSerializer.Serialize(document.RootElement);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException("ContentJson must be valid JSON", ex);
        }
    }
}
