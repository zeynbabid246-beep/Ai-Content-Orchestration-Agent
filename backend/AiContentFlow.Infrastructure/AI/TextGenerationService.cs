using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Application.Interfaces;

public class TextGenerationService : ITextGenerationService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public TextGenerationService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<string> GenerateTextAsync(string prompt, string model)
    {
        try
        {
            return model switch
            {
                "gpt-4o-mini" => await CallOpenAI(prompt, "gpt-4o-mini"),
                "gpt-4o" => await CallOpenAI(prompt, "gpt-4o"),
                "gpt-5.3" => await CallOpenAI(prompt, "gpt-4o-mini"),
                "gpt-oss-120b" => await CallOpenAI(prompt, "gpt-oss-120b"),
                "deepseek-r1" => await CallDeepSeek(prompt),
                "deepseek-chat" => await CallDeepSeek(prompt),
                 "gemini"         => await CallGemini(prompt),  
                 "groq" => await CallGroq(prompt),
    
                _ => throw new Exception($"Model not supported: {model}")
            };
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests || ex.Message.Contains("429"))
        {
            Console.WriteLine("Rate limit hit → switching to Gemini");

            return await CallGemini(prompt);
        }
    }

    // OPENAI
    private async Task<string> CallOpenAI(string prompt, string model)
    {
        var apiKey = _config["OpenAI:ApiKey"];

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.openai.com/v1/chat/completions");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model = model,
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };

        req.Content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json"
        );

        var res = await _http.SendAsync(req);

        if (res.StatusCode == HttpStatusCode.TooManyRequests)
            throw new HttpRequestException("429 Too Many Requests", null, HttpStatusCode.TooManyRequests);

        res.EnsureSuccessStatusCode();

        var json = await res.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString()!;
    }

    // DEEPSEEK
    private async Task<string> CallDeepSeek(string prompt)
    {
        var apiKey = _config["DeepSeek:ApiKey"];

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.deepseek.com/v1/chat/completions");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model = "deepseek-chat",
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };

        req.Content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json"
        );

        var res = await _http.SendAsync(req);

        if (res.StatusCode == HttpStatusCode.TooManyRequests)
            throw new HttpRequestException("429 Too Many Requests", null, HttpStatusCode.TooManyRequests);

        res.EnsureSuccessStatusCode();

        var json = await res.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString()!;
    }

    // GEMINI (FREE FALLBACK)
    private async Task<string> CallGemini(string prompt)
{
    var apiKey = _config["Gemini:ApiKey"];

    var requestBody = new
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
        }
    };

    var req = new HttpRequestMessage(
        HttpMethod.Post,
        $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}"
    );

    req.Content = new StringContent(
        JsonSerializer.Serialize(requestBody),
        Encoding.UTF8,
        "application/json"
    );

    var res = await _http.SendAsync(req);

    if (!res.IsSuccessStatusCode)
    {
        var errorBody = await res.Content.ReadAsStringAsync();
        throw new HttpRequestException($"Gemini error {res.StatusCode}: {errorBody}");
    }

    var json = await res.Content.ReadAsStringAsync();

    using var doc = JsonDocument.Parse(json);
    return doc.RootElement
        .GetProperty("candidates")[0]
        .GetProperty("content")
        .GetProperty("parts")[0]
        .GetProperty("text")
        .GetString() ?? "No response from Gemini";
}
// call Groq 
private async Task<string> CallGroq(string prompt)
{
    var apiKey = _config["Groq:ApiKey"];

    var req = new HttpRequestMessage(HttpMethod.Post,
        "https://api.groq.com/openai/v1/chat/completions");

    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

    var body = new
    {
        model = "llama-3.3-70b-versatile",
        messages = new[]
        {
            new { role = "user", content = prompt }
        }
    };

    req.Content = new StringContent(
        JsonSerializer.Serialize(body),
        Encoding.UTF8,
        "application/json"
    );

    var res = await _http.SendAsync(req);

    if (!res.IsSuccessStatusCode)
    {
        var error = await res.Content.ReadAsStringAsync();
        throw new HttpRequestException($"Groq error {res.StatusCode}: {error}");
    }

    var json = await res.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);
    return doc.RootElement
        .GetProperty("choices")[0]
        .GetProperty("message")
        .GetProperty("content")
        .GetString()!;
}
}