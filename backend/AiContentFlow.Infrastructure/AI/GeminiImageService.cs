using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Application.Interfaces;
public class GeminiImageService : IImageGenerationService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public GeminiImageService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<string> GenerateImageAsync(string prompt, string model)
    {
        // Handle Pollinations first — no API call needed
        if (model == "pollinations")
            return CallPollinationsImage(prompt);

        var normalizedModel = model switch
        {
            "gemini-2.5-flash" => "gemini-2.5-flash",
            "gemini-2.0-flash" => "gemini-2.0-flash",
            "gemini-1.5-flash" => "gemini-2.0-flash",
            "gemini1_5flash"   => "gemini-2.0-flash",
            _                  => "gemini-2.0-flash"
        };

        var apiKey = _config["Gemini:ApiKey"];
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{normalizedModel}:generateContent?key={apiKey}";

        var body = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                response_modalities = new[] { "IMAGE" }
            }
        };

        var res = await _http.PostAsync(url,
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));

        if (!res.IsSuccessStatusCode)
        {
            var error = await res.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Gemini image error {res.StatusCode}: {error}");
        }

        var json = await res.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);

        var base64 = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("inline_data")
            .GetProperty("data")
            .GetString();

        var bytes = Convert.FromBase64String(base64!);

        Directory.CreateDirectory("images");
        var fileName = $"images/{Guid.NewGuid()}.png";
        await File.WriteAllBytesAsync(fileName, bytes);

        return fileName;
    }

    private string CallPollinationsImage(string prompt)
    {
        var encodedPrompt = Uri.EscapeDataString(prompt);
        return $"https://image.pollinations.ai/prompt/{encodedPrompt}?width=1024&height=1024&nologo=true";
    }
}