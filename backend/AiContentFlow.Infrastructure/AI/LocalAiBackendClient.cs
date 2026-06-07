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
    private const int DefaultTimeoutSeconds = 75;
    private const int BrandAnalyzeTimeoutSeconds = 95;
    // Full campaign content can generate many posts + posters/carousels sequentially.
    private const int CampaignContentTimeoutSeconds = 900;
    private const int CreativeTimeoutSeconds = 180;
    private static readonly TimeSpan CircuitOpenDuration = TimeSpan.FromSeconds(45);

    private readonly TimeSpan _defaultTimeout;
    private readonly TimeSpan _brandAnalyzeTimeout;
    private readonly TimeSpan _campaignContentTimeout;
    private readonly TimeSpan _creativeTimeout;

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
        _defaultTimeout = TimeSpan.FromSeconds(
            configuration.GetValue("LocalAI:DefaultTimeoutSeconds", DefaultTimeoutSeconds));
        _brandAnalyzeTimeout = TimeSpan.FromSeconds(
            configuration.GetValue("LocalAI:BrandAnalyzeTimeoutSeconds", BrandAnalyzeTimeoutSeconds));
        _campaignContentTimeout = TimeSpan.FromSeconds(
            configuration.GetValue("LocalAI:CampaignContentTimeoutSeconds", CampaignContentTimeoutSeconds));
        _creativeTimeout = TimeSpan.FromSeconds(
            configuration.GetValue("LocalAI:CreativeTimeoutSeconds", CreativeTimeoutSeconds));
        // Per-request timeouts are enforced in SendAsync; HttpClient.Timeout must not cap them.
        _httpClient.Timeout = Timeout.InfiniteTimeSpan;
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
        string? trendIntelligence = null,
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
                custom_prompt = customPrompt ?? string.Empty,
                campaign_direction = customPrompt ?? string.Empty,
                trend_intelligence = trendIntelligence ?? "Auto"
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
        string? selectedContentDirection = null,
        string directionMode = "single",
        CancellationToken cancellationToken = default)
        => SendAsync(
            "/api/planning/generate",
            new
            {
                strategy = JsonSerializer.Deserialize<object>(strategy.GetRawText()),
                strategy_id = strategyId,
                posts_per_week = postsPerWeek,
                platforms = platforms.Select(p => p.ToLowerInvariant()).ToArray(),
                language,
                direction_mode = directionMode,
                selected_content_direction = selectedContentDirection ?? string.Empty
            },
            correlationId,
            cancellationToken);

    public Task<JsonElement> GenerateCampaignContentAsync(
        JsonElement strategy,
        JsonElement planning,
        int planningId,
        string orgId,
        IReadOnlyList<string> platforms,
        string primaryPlatform,
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
                platforms = platforms.Select(p => p.ToLowerInvariant()).ToArray(),
                primary_platform = primaryPlatform.ToLowerInvariant(),
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

    public Task<JsonElement> AssistantChatAsync(
        object requestBody,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync("/assistant/chat", requestBody, correlationId, cancellationToken);

    public Task<JsonElement> GeneratePosterAsync(
        object requestBody,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync("/api/creative/generate-poster", requestBody, correlationId, cancellationToken);

    public Task<JsonElement> GenerateCarouselAsync(
        object requestBody,
        string correlationId,
        CancellationToken cancellationToken = default)
        => SendAsync("/api/creative/generate-carousel", requestBody, correlationId, cancellationToken);

    public async Task<bool> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        if (IsCircuitOpen("/health"))
            return false;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/health");
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(10));
            using var response = await _httpClient.SendAsync(request, timeoutCts.Token);
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

                var requestTimeout = GetTimeoutForPath(path);
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(requestTimeout);

                var response = await _httpClient.SendAsync(request, timeoutCts.Token);
                var payload = await response.Content.ReadAsStringAsync(timeoutCts.Token);
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

        var timeoutHint = lastException is TaskCanceledException or OperationCanceledException
            ? path.Equals("/api/campaign-content/generate", StringComparison.OrdinalIgnoreCase)
                ? $" Request timed out after {(int)_campaignContentTimeout.TotalSeconds}s. " +
                  "Campaign content with multiple image creatives is slow — increase LocalAI:CampaignContentTimeoutSeconds in appsettings (default 900s)."
                : path.Equals("/api/creative/generate-poster", StringComparison.OrdinalIgnoreCase)
                  || path.Equals("/api/creative/generate-carousel", StringComparison.OrdinalIgnoreCase)
                    ? $" Request timed out after {(int)_creativeTimeout.TotalSeconds}s. " +
                      "Creative generation can be slow — increase LocalAI:CreativeTimeoutSeconds in appsettings (default 180s)."
                    : $" Request timed out after {(int)GetTimeoutForPath(path).TotalSeconds}s."
            : string.Empty;

        throw new InvalidOperationException(
            $"Local AI backend call failed on path '{path}'.{timeoutHint} {lastException?.Message}",
            lastException);
    }

    private TimeSpan GetTimeoutForPath(string path)
    {
        if (path.Equals("/api/brand/analyze", StringComparison.OrdinalIgnoreCase))
            return _brandAnalyzeTimeout;
        if (path.Equals("/api/campaign-content/generate", StringComparison.OrdinalIgnoreCase))
            return _campaignContentTimeout;
        if (path.Equals("/api/creative/generate-poster", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/api/creative/generate-carousel", StringComparison.OrdinalIgnoreCase))
            return _creativeTimeout;
        return _defaultTimeout;
    }

    private static bool IsRetryable(string path, Exception ex)
    {
        // Long-running paths should not retry on timeout — each attempt can take many minutes.
        if (ex is TaskCanceledException or OperationCanceledException)
        {
            if (path.Equals("/api/brand/analyze", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/api/campaign-content/generate", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/api/creative/generate-poster", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/api/creative/generate-carousel", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return true;
        }
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
