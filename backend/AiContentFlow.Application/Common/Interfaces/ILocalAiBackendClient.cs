using System.Text.Json;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ILocalAiBackendClient
{
    Task<JsonElement> AnalyzeBrandAsync(string orgId, string websiteUrl, string correlationId, CancellationToken cancellationToken = default);

    Task<JsonElement> GenerateContentAsync(
        string mode,
        string? orgId,
        string prompt,
        IReadOnlyList<string> platforms,
        string? language,
        LocalAiBrandContext? brandContext,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<JsonElement> GenerateStrategyAsync(
        string orgId,
        string goal,
        string theme,
        string language,
        int postsPerWeek,
        IReadOnlyList<string> platforms,
        string? customPrompt,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<JsonElement> GeneratePlanningAsync(
        JsonElement strategy,
        int strategyId,
        int postsPerWeek,
        IReadOnlyList<string> platforms,
        string language,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<JsonElement> GenerateCampaignContentAsync(
        JsonElement strategy,
        JsonElement planning,
        int planningId,
        string orgId,
        string platform,
        object? brandContext,
        string language,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<JsonElement> ConfigureBrandManualAsync(
        object requestBody,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<bool> GetHealthAsync(CancellationToken cancellationToken = default);
}
