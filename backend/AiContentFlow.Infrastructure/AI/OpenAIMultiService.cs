using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Application.Interfaces;
public class OpenAIMultiService : ITextGenerationService, IImageGenerationService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public OpenAIMultiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<string> GenerateTextAsync(string prompt, string model)
    {
        var apiKey = _config["OpenAI:ApiKey"];

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.openai.com/v1/chat/completions");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        req.Content = JsonContent.Create(new
        {
            model = "gpt-oss-120b",
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        });

        var res = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString()!;
    }

    public async Task<string> GenerateImageAsync(string prompt, string model)
    {
        var apiKey = _config["OpenAI:ApiKey"];

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.openai.com/v1/images/generations");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        req.Content = JsonContent.Create(new
        {
            prompt,
            size = "1024x1024"
        });

        var res = await _http.SendAsync(req);
        var json = await res.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("data")[0]
            .GetProperty("url")
            .GetString()!;
    }
}