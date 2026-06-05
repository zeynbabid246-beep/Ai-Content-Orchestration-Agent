using System.Net;
using System.Text;
using System.Text.Json;
using System.Collections.Concurrent;
using AiContentFlow.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.AI;

public class LocalAiBackendClient : ILocalAiBackendClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LocalAiBackendClient> _logger;
    private readonly string _baseUrl;
    private static readonly ConcurrentDictionary<string, CircuitState> Circuit = new();
    private const int MaxAttempts = 2;
    private const int FailureThreshold = 4;
    private static readonly TimeSpan CircuitOpenDuration = TimeSpan.FromSeconds(45);
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(75);
    private static readonly TimeSpan BrandAnalyzeTimeout = TimeSpan.FromSeconds(95);

    private sealed class CircuitState
    {
        public int Failures { get; set; }
        public DateTime? OpenUntilUtc { get; set; }
    }

    public LocalAiBackendClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<LocalAiBackendClient> logger)
    {
        _httpClient = httpClientFactory.CreateClient(nameof(LocalAiBackendClient));
        _logger = logger;
        _baseUrl = (configuration["LocalAI:BaseUrl"] ?? "http://127.0.0.1:8000").TrimEnd('/');
        _httpClient.Timeout = DefaultTimeout;
    }

    public Task<JsonElement> AnalyzeBrandAsync(string orgId, string websiteUrl, string correlationId, CancellationToken cancellationToken = default)
        => SendAsync(
            "/api/brand/analyze",
            new { org_id = orgId, website_url = websiteUrl },
            correlationId,
            cancellationToken);

    public Task<JsonElement> GenerateContentAsync(
        string mode,
        string? orgId,
        string prompt,
        IReadOnlyList<string> platforms,
        string? language,
        LocalAiBrandContext? brandContext,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        object? brandContextBody = null;
        if (brandContext is not null)
        {
            brandContextBody = new
            {
                brand_name = brandContext.BrandName,
                website_url = brandContext.WebsiteUrl,
                slogan = brandContext.Slogan,
                archetype = brandContext.Archetype,
                tone_of_voice = brandContext.ToneOfVoice ?? Array.Empty<string>(),
                audience_signals = brandContext.AudienceSignals ?? Array.Empty<string>(),
                content_pillars = brandContext.ContentPillars ?? Array.Empty<string>(),
                brand_summary = brandContext.BrandSummary
            };
        }

        return SendAsync(
            "/api/orchestrator/run",
            new
            {
                mode,
                org_id = orgId,
                prompt,
                platforms = platforms.Select(p => p.ToLowerInvariant()).ToArray(),
                language,
                brand_context = brandContextBody
            },
            correlationId,
            cancellationToken);
    }

    public Task<JsonElement> GenerateStrategyAsync(
        string orgId,
        string goal,
        string theme,
        string language,
        int postsPerWeek,
        IReadOnlyList<string> platforms,
        string? customPrompt,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync(
            "/api/strategy/generate",
            new
            {
                org_id = orgId,
                goal,
                theme,
                language,
                posts_per_week = postsPerWeek,
                platforms = platforms.Select(p => p.ToLowerInvariant()).ToArray(),
                custom_prompt = customPrompt ?? string.Empty
            },
            correlationId,
            cancellationToken);

    public Task<JsonElement> GeneratePlanningAsync(
        JsonElement strategy,
        int strategyId,
        int postsPerWeek,
        IReadOnlyList<string> platforms,
        string language,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync(
            "/api/planning/generate",
            new
            {
                strategy = JsonSerializer.Deserialize<object>(strategy.GetRawText()),
                strategy_id = strategyId,
                posts_per_week = postsPerWeek,
                platforms = platforms.Select(p => p.ToLowerInvariant()).ToArray(),
                language
            },
            correlationId,
            cancellationToken);

    public Task<JsonElement> GenerateCampaignContentAsync(
        JsonElement strategy,
        JsonElement planning,
        int planningId,
        string orgId,
        string platform,
        object? brandContext,
        string language,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync(
            "/api/campaign-content/generate",
            new
            {
                strategy = JsonSerializer.Deserialize<object>(strategy.GetRawText()),
                planning = JsonSerializer.Deserialize<object>(planning.GetRawText()),
                planning_id = planningId,
                org_id = orgId,
                platform = platform.ToLowerInvariant(),
                brand_context = brandContext ?? new { },
                language
            },
            correlationId,
            cancellationToken);

    public Task<JsonElement> ConfigureBrandManualAsync(
        object requestBody,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync("/api/brand/manual", requestBody, correlationId, cancellationToken);

    public async Task<bool> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        if (IsCircuitOpen("/health"))
            return false;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/health");
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            MarkSuccess("/health");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            MarkFailure("/health");
            _logger.LogWarning(ex, "Local AI health check failed");
            return false;
        }
    }

    private async Task<JsonElement> SendAsync(string path, object body, string correlationId, CancellationToken cancellationToken)
    {
        if (IsCircuitOpen(path))
            throw new InvalidOperationException(
                $"Local AI backend circuit is open for path '{path}'. Wait about 45 seconds and retry, or restart the .NET API after fixing the AI service.");

        Exception? lastException = null;
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}{path}");
                request.Headers.Add("X-Correlation-ID", correlationId);
                request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(path.Equals("/api/brand/analyze", StringComparison.OrdinalIgnoreCase)
                    ? BrandAnalyzeTimeout
                    : DefaultTimeout);

                var response = await _httpClient.SendAsync(request, timeoutCts.Token);
                var payload = await response.Content.ReadAsStringAsync(cancellationToken);
                if (!response.IsSuccessStatusCode)
                    throw new HttpRequestException(
                        $"Local AI backend request failed ({response.StatusCode}) on '{path}': {payload}",
                        null,
                        response.StatusCode);

                using var doc = JsonDocument.Parse(payload);
                MarkSuccess(path);
                _logger.LogInformation("Local AI call succeeded. Path={Path} CorrelationId={CorrelationId}", path, correlationId);
                return doc.RootElement.Clone();
            }
            catch (Exception ex) when (IsRetryable(path, ex) && attempt < MaxAttempts)
            {
                lastException = ex;
                _logger.LogWarning(ex, "Local AI retry. Path={Path} Attempt={Attempt}", path, attempt);
                await Task.Delay(TimeSpan.FromMilliseconds(250 * attempt), cancellationToken);
            }
            catch (Exception ex)
            {
                lastException = ex;
                MarkFailure(path);
                _logger.LogError(ex, "Local AI failed. Path={Path} CorrelationId={CorrelationId}", path, correlationId);
                break;
            }
        }

        throw new InvalidOperationException(
            $"Local AI backend call failed on path '{path}'. {lastException?.Message}",
            lastException);
    }

    private static bool IsRetryable(string path, Exception ex)
    {
        // Brand analyze can be expensive and often fails due to unreachable website;
        // avoid retry storms on timeouts for this path.
        if (path.Equals("/api/brand/analyze", StringComparison.OrdinalIgnoreCase)
            && ex is TaskCanceledException)
        {
            return false;
        }

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
        return message.Contains("timeout") || message.Contains("connection");
    }

    private static bool IsCircuitOpen(string key)
    {
        if (!Circuit.TryGetValue(key, out var state) || state.OpenUntilUtc is null)
            return false;

        if (state.OpenUntilUtc <= DateTime.UtcNow)
        {
            state.OpenUntilUtc = null;
            state.Failures = 0;
            return false;
        }
        return true;
    }

    private static void MarkFailure(string key)
    {
        var state = Circuit.GetOrAdd(key, _ => new CircuitState());
        state.Failures += 1;
        if (state.Failures >= FailureThreshold)
            state.OpenUntilUtc = DateTime.UtcNow.Add(CircuitOpenDuration);
    }

    private static void MarkSuccess(string key)
    {
        if (!Circuit.TryGetValue(key, out var state))
            return;
        state.Failures = 0;
        state.OpenUntilUtc = null;
    }
}
