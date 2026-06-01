using System.Net;
using System.Net.Http.Headers;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Application.Interfaces;

public class TextGenerationService : ITextGenerationService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<TextGenerationService> _logger;
    private static readonly ConcurrentDictionary<string, CircuitState> ProviderCircuit = new();
    private const int MaxAttempts = 2;
    private static readonly TimeSpan ProviderTimeout = TimeSpan.FromSeconds(25);
    private static readonly TimeSpan CircuitBreakDuration = TimeSpan.FromMinutes(2);
    private const int CircuitFailureThreshold = 5;

    private sealed class CircuitState
    {
        public int Failures { get; set; }
        public DateTime? OpenUntilUtc { get; set; }
    }

    public TextGenerationService(HttpClient http, IConfiguration config, ILogger<TextGenerationService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
        _http.Timeout = ProviderTimeout;
    }

    public async Task<string> GenerateTextAsync(string prompt, string model, AiUseCase useCase = AiUseCase.GeneratePost)
    {
        var requestedModel = string.IsNullOrWhiteSpace(model) ? ResolveDefaultModel(useCase) : model.Trim();
        var providerPlan = ResolveProviderPlan(requestedModel, useCase);
        Exception? lastException = null;

        foreach (var provider in providerPlan)
        {
            if (IsCircuitOpen(provider))
            {
                _logger.LogWarning("AI provider circuit open. Provider={Provider} UseCase={UseCase}", provider, useCase);
                continue;
            }

            for (var attempt = 1; attempt <= MaxAttempts; attempt++)
            {
                var stopwatch = Stopwatch.StartNew();
                try
                {
                    var result = await (provider switch
                    {
                        "openai" => CallOpenAI(prompt, requestedModel),
                        "deepseek" => CallDeepSeek(prompt),
                        "gemini" => CallGemini(prompt),
                        "groq" => CallGroq(prompt),
                        _ => throw new InvalidOperationException($"Provider '{provider}' is not supported."),
                    });

                    stopwatch.Stop();
                    MarkProviderSuccess(provider);
                    _logger.LogInformation(
                        "AI generation succeeded. Provider={Provider} Model={Model} UseCase={UseCase} LatencyMs={LatencyMs}",
                        provider,
                        requestedModel,
                        useCase,
                        stopwatch.ElapsedMilliseconds);
                    return result;
                }
                catch (Exception ex) when (IsRetryable(ex) && attempt < MaxAttempts)
                {
                    stopwatch.Stop();
                    _logger.LogWarning(
                        ex,
                        "AI provider retry. Provider={Provider} Attempt={Attempt} UseCase={UseCase} LatencyMs={LatencyMs}",
                        provider,
                        attempt,
                        useCase,
                        stopwatch.ElapsedMilliseconds);
                    await Task.Delay(TimeSpan.FromMilliseconds(300 * attempt));
                    lastException = ex;
                }
                catch (Exception ex)
                {
                    stopwatch.Stop();
                    MarkProviderFailure(provider);
                    _logger.LogError(
                        ex,
                        "AI provider failure. Provider={Provider} Model={Model} UseCase={UseCase} LatencyMs={LatencyMs}",
                        provider,
                        requestedModel,
                        useCase,
                        stopwatch.ElapsedMilliseconds);
                    lastException = ex;
                    break;
                }
            }
        }

        throw new InvalidOperationException(
            $"AI generation failed for use case '{useCase}' after exhausting provider fallbacks.",
            lastException);
    }

    private string ResolveDefaultModel(AiUseCase useCase)
        => useCase switch
        {
            AiUseCase.BrandExtraction => "gemini",
            AiUseCase.SuggestCampaign => "groq",
            _ => "groq",
        };

    private List<string> ResolveProviderPlan(string requestedModel, AiUseCase useCase)
    {
        var requestedProvider = ResolveProviderName(requestedModel);
        var defaults = useCase switch
        {
            AiUseCase.BrandExtraction => new[] { "gemini", "groq", "openai" },
            AiUseCase.SuggestCampaign => new[] { "groq", "openai", "gemini" },
            _ => new[] { "groq", "openai", "gemini" },
        };

        var plan = new List<string> { requestedProvider };
        plan.AddRange(defaults.Where(x => !string.Equals(x, requestedProvider, StringComparison.OrdinalIgnoreCase)));
        return plan.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string ResolveProviderName(string model)
    {
        var normalized = model.Trim().ToLowerInvariant();
        if (normalized.StartsWith("gpt") || normalized.Contains("openai"))
            return "openai";
        if (normalized.StartsWith("deepseek"))
            return "deepseek";
        if (normalized.StartsWith("gemini"))
            return "gemini";
        if (normalized.StartsWith("groq") || normalized.Contains("llama"))
            return "groq";
        return "groq";
    }

    private static bool IsRetryable(Exception ex)
    {
        if (ex is TaskCanceledException)
            return true;

        if (ex is HttpRequestException httpEx)
        {
            if (httpEx.StatusCode == HttpStatusCode.TooManyRequests)
                return true;
            if ((int?)httpEx.StatusCode >= 500)
                return true;
        }

        var message = ex.Message.ToLowerInvariant();
        return message.Contains("429")
            || message.Contains("timeout")
            || message.Contains("temporarily unavailable");
    }

    private static bool IsCircuitOpen(string provider)
    {
        if (!ProviderCircuit.TryGetValue(provider, out var state))
            return false;

        if (state.OpenUntilUtc is null)
            return false;

        if (state.OpenUntilUtc <= DateTime.UtcNow)
        {
            state.OpenUntilUtc = null;
            state.Failures = 0;
            return false;
        }

        return true;
    }

    private static void MarkProviderFailure(string provider)
    {
        var state = ProviderCircuit.GetOrAdd(provider, _ => new CircuitState());
        state.Failures += 1;
        if (state.Failures >= CircuitFailureThreshold)
            state.OpenUntilUtc = DateTime.UtcNow.Add(CircuitBreakDuration);
    }

    private static void MarkProviderSuccess(string provider)
    {
        if (!ProviderCircuit.TryGetValue(provider, out var state))
            return;

        state.Failures = 0;
        state.OpenUntilUtc = null;
    }

    private string ResolveOpenAiModel(string model)
    {
        var normalized = model.Trim().ToLowerInvariant();
        return normalized switch
        {
            "gpt-4o-mini" => "gpt-4o-mini",
            "gpt-4o" => "gpt-4o",
            "gpt-5.3" => "gpt-4o-mini",
            "gpt-oss-120b" => "gpt-oss-120b",
            _ => _config["OpenAI:DefaultModel"] ?? "gpt-4o-mini"
        };
    }

    private string ResolveDeepSeekModel(string model)
    {
        var normalized = model.Trim().ToLowerInvariant();
        return normalized switch
        {
            "deepseek-r1" => "deepseek-r1",
            "deepseek-chat" => "deepseek-chat",
            _ => _config["DeepSeek:DefaultModel"] ?? "deepseek-chat"
        };
    }

    private string ResolveGroqModel(string model)
    {
        var normalized = model.Trim().ToLowerInvariant();
        return normalized switch
        {
            "groq" => "llama-3.3-70b-versatile",
            _ => _config["Groq:DefaultModel"] ?? "llama-3.3-70b-versatile"
        };
    }

    private string ResolveGeminiModel()
    {
        return _config["Gemini:DefaultModel"] ?? "gemini-2.0-flash";
    }

    private static void EnsureApiKey(string? apiKey, string provider)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException($"Missing API key configuration for provider '{provider}'.");
    }

    // OPENAI
    private async Task<string> CallOpenAI(string prompt, string model)
    {
        var apiKey = _config["OpenAI:ApiKey"];
        EnsureApiKey(apiKey, "openai");

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.openai.com/v1/chat/completions");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model = ResolveOpenAiModel(model),
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
        EnsureApiKey(apiKey, "deepseek");

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.deepseek.com/v1/chat/completions");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model = ResolveDeepSeekModel("deepseek-chat"),
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

    // GEMINI
    private async Task<string> CallGemini(string prompt)
    {
        var apiKey = _config["Gemini:ApiKey"];
        EnsureApiKey(apiKey, "gemini");

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
            $"https://generativelanguage.googleapis.com/v1beta/models/{ResolveGeminiModel()}:generateContent?key={apiKey}"
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

    // GROQ
    private async Task<string> CallGroq(string prompt)
    {
        var apiKey = _config["Groq:ApiKey"];
        EnsureApiKey(apiKey, "groq");

        var req = new HttpRequestMessage(HttpMethod.Post,
            "https://api.groq.com/openai/v1/chat/completions");

        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model = ResolveGroqModel("groq"),
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