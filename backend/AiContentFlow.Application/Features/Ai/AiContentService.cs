using System.Collections.Concurrent;
using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Ai.Dtos;
using AiContentFlow.Domain.Models;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Application.Features.Ai;

public class AiContentService : IAiContentService
{
    private const int DefaultDailyLimitPerTeam = 150;
    private const int DefaultMaxPromptLength = 4_000;
    private const int DefaultMaxOutputLength = 2_000;
    private static readonly ConcurrentDictionary<string, int> DailyRequestCounter = new();

    private readonly ITeamRepository _teamRepository;
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly IChannelRepository _channelRepository;
    private readonly ILocalAiBackendClient _localAiBackendClient;
    private readonly ITextGenerationService _textGenerationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiContentService> _logger;

    public AiContentService(
        ITeamRepository teamRepository,
        IBrandStudioRepository brandStudioRepository,
        IChannelRepository channelRepository,
        ILocalAiBackendClient localAiBackendClient,
        ITextGenerationService textGenerationService,
        IConfiguration configuration,
        ILogger<AiContentService> logger)
    {
        _teamRepository = teamRepository;
        _brandStudioRepository = brandStudioRepository;
        _channelRepository = channelRepository;
        _localAiBackendClient = localAiBackendClient;
        _textGenerationService = textGenerationService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GeneratePostResponseDto> GeneratePostAsync(
        Guid teamId,
        string requestingUserId,
        GeneratePostRequestDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        EnsureWithinTeamDailyBudget(teamId);
        ValidatePrompt(dto.Prompt);

        var brandContext = dto.UseBrandContext
            ? await BuildBrandContextAsync(teamId, dto.ChannelId)
            : "No brand context requested.";

        var formatHint = BuildFormatHint(dto.Format);
        var platformHint = BuildPlatformHint(dto.Platform);

        if (IsExternalProviderMode())
        {
            var model = string.IsNullOrWhiteSpace(dto.Model) ? "groq" : dto.Model.Trim();
            var prompt = $"""
                Write a social media post as JSON.
                {platformHint}
                {formatHint}
                Required JSON shape:
                - For standard posts: an object with a "text" field
                - For carousels: an object with "text" and "slides" array fields
                Prompt: {dto.Prompt}
                Brand context:
                {brandContext}
                Return only JSON.
                """;
            var generated = await _textGenerationService.GenerateTextAsync(prompt, model, AiUseCase.GeneratePost);
            var contentJsonExternal = NormalizeGeneratedJson(generated);
            LogAIMetrics("generate-post-external", teamId, model, prompt, contentJsonExternal);
            return new GeneratePostResponseDto(contentJsonExternal, model, null);
        }

        var correlationId = Guid.NewGuid().ToString("N");
        var orgId = BuildOrgId(teamId);
        var platform = MapPlatformForLocalAi(dto.Platform);
        var mode = "prompt_only";
        LocalAiBrandContext? localBrandContext = null;

        if (dto.UseBrandContext)
        {
            var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
            if (brandStudio is not null)
            {
                mode = "manual_brand";
                localBrandContext = MapLocalBrandContext(brandStudio);
            }
            else
            {
                mode = "scraped_brand";
            }
        }

        var aiPrompt = $"""
            {dto.Prompt.Trim()}
            {BuildPlatformHint(dto.Platform)}
            {BuildFormatHint(dto.Format)}
            """;

        var aiResponse = await _localAiBackendClient.GenerateContentAsync(
            mode,
            mode == "prompt_only" ? null : orgId,
            aiPrompt,
            [platform],
            language: null,
            localBrandContext,
            correlationId);

        var contentJson = NormalizeGeneratedJson(ExtractContentText(aiResponse));
        LogAIMetrics("generate-post-local", teamId, "local-ai-backend", aiPrompt, contentJson);
        return new GeneratePostResponseDto(contentJson, "local-ai-backend", correlationId);
    }

    public async Task<SuggestCampaignResponseDto> SuggestCampaignAsync(
        Guid teamId,
        string requestingUserId,
        SuggestCampaignRequestDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        EnsureWithinTeamDailyBudget(teamId);
        ValidatePrompt(dto.Goal);

        var channel = await _channelRepository.GetByIdAsync(teamId, dto.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        if (IsExternalProviderMode())
        {
            var brandContext = await BuildBrandContextAsync(teamId, dto.ChannelId);
            var model = "groq";
            var prompt = $"""
                Suggest a marketing campaign as JSON with keys:
                campaignName, description, posts (array of objects with title, text, contentType, scheduledAt ISO-8601, platform).
                Goal: {dto.Goal}
                Channel context: {brandContext}
                Date range: {dto.StartDate:O} to {dto.EndDate:O}
                Platforms: {string.Join(", ", dto.Platforms)}
                Return 3 to 6 posts spread across the date range. Return only JSON.
                """;
            var generated = await _textGenerationService.GenerateTextAsync(prompt, model, AiUseCase.SuggestCampaign);
            return ParseCampaignSuggestion(generated, dto);
        }

        var correlationId = Guid.NewGuid().ToString("N");
        var orgId = BuildOrgId(teamId);
        var platforms = dto.Platforms.Select(p => p.ToString()).ToList();
        var strategyStep = new CampaignStepStatusDto("strategy", "pending", null, null, null);
        var planningStep = new CampaignStepStatusDto("planning", "pending", null, null, null);
        var campaignStep = new CampaignStepStatusDto("campaign", "pending", null, null, null);
        var errors = new List<string>();
        string campaignName = $"Campaign: {dto.Goal}";
        string description = $"Generated for {channel.Name}";
        List<SuggestedCampaignPostDto> posts = [];

        JsonElement? strategyPayload = null;
        JsonElement? planningPayload = null;
        JsonElement? campaignPayload = null;

        try
        {
            strategyPayload = await _localAiBackendClient.GenerateStrategyAsync(
                orgId,
                dto.Goal,
                $"{channel.Name} | {dto.Goal}",
                "English",
                ComputePostsPerWeek(dto.StartDate, dto.EndDate),
                platforms,
                correlationId);
            var strategyId = GetInt(strategyPayload.Value, "strategy_id") ?? GetInt(strategyPayload.Value, "id");
            strategyStep = strategyStep with
            {
                Status = "completed",
                Id = strategyId,
                Summary = GetString(strategyPayload.Value, "summary")
                    ?? GetString(strategyPayload.Value, "strategy_summary")
                    ?? "Strategy generated"
            };

            if (!strategyId.HasValue)
                throw new InvalidOperationException("Strategy step did not return strategy_id.");

            planningPayload = await _localAiBackendClient.GeneratePlanningAsync(
                strategyId.Value,
                ComputePostsPerWeek(dto.StartDate, dto.EndDate),
                platforms,
                "English",
                correlationId);
            var planningId = GetInt(planningPayload.Value, "planning_id") ?? GetInt(planningPayload.Value, "id");
            planningStep = planningStep with
            {
                Status = "completed",
                Id = planningId,
                Summary = GetString(planningPayload.Value, "summary")
                    ?? GetString(planningPayload.Value, "planning_summary")
                    ?? "Planning generated"
            };

            if (!planningId.HasValue)
                throw new InvalidOperationException("Planning step did not return planning_id.");

            campaignPayload = await _localAiBackendClient.GenerateCampaignContentAsync(
                planningId.Value,
                platforms,
                "English",
                correlationId);
            campaignStep = campaignStep with
            {
                Status = "completed",
                Id = GetInt(campaignPayload.Value, "campaign_id") ?? GetInt(campaignPayload.Value, "id"),
                Summary = GetString(campaignPayload.Value, "summary")
                    ?? GetString(campaignPayload.Value, "campaign_summary")
                    ?? "Campaign content generated"
            };

            campaignName = GetString(campaignPayload.Value, "campaign_name")
                ?? GetString(strategyPayload.Value, "campaign_name")
                ?? campaignName;
            description = GetString(campaignPayload.Value, "description")
                ?? GetString(strategyPayload.Value, "description")
                ?? description;
            posts = ExtractPosts(campaignPayload.Value, dto);
            if (posts.Count == 0)
                posts = BuildFallbackCampaign(dto).Posts.ToList();
        }
        catch (Exception ex)
        {
            errors.Add(ex.Message);
            if (strategyStep.Status != "completed")
                strategyStep = strategyStep with { Status = "failed", Error = ex.Message };
            else if (planningStep.Status != "completed")
                planningStep = planningStep with { Status = "failed", Error = ex.Message };
            else
                campaignStep = campaignStep with { Status = "failed", Error = ex.Message };
        }

        if (posts.Count == 0)
            posts = BuildFallbackCampaign(dto).Posts.ToList();

        var promptForMetrics = $"{dto.Goal}::{channel.Name}::{string.Join(",", platforms)}";
        var serialized = JsonSerializer.Serialize(posts);
        LogAIMetrics("suggest-campaign-local-3step", teamId, "local-ai-backend", promptForMetrics, serialized);

        return new SuggestCampaignResponseDto(
            campaignName,
            description,
            posts,
            strategyStep,
            planningStep,
            campaignStep,
            errors,
            correlationId);
    }

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can use AI features");
    }

    private async Task<string> BuildBrandContextAsync(Guid teamId, int? channelId)
    {
        var parts = new List<string>();
        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        if (brandStudio is not null)
        {
            parts.Add($"Brand: {brandStudio.BrandName}");
            parts.Add($"Summary: {brandStudio.BrandSummary}");
            parts.Add($"Positioning: {brandStudio.EnrichedPositioningStatement}");
            parts.Add($"Audience: {brandStudio.DefaultTargetAudience}");
            parts.Add($"Tone: {brandStudio.DefaultToneOfVoice}");
            if (brandStudio.ContentPillars.Count > 0)
                parts.Add($"Content pillars: {string.Join(", ", brandStudio.ContentPillars)}");
        }

        if (channelId.HasValue)
        {
            var channel = await _channelRepository.GetByIdAsync(teamId, channelId.Value);
            if (channel is not null)
            {
                parts.Add($"Channel: {channel.Name}");
                if (channel.Branding?.Tone is not null)
                    parts.Add($"Channel tone: {channel.Branding.Tone}");
            }
        }

        return parts.Count == 0 ? "No brand context available." : string.Join("\n", parts);
    }

    private static string NormalizeGeneratedJson(string generated)
    {
        try
        {
            var json = ExtractJson(generated);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Object)
            {
                var root = doc.RootElement;
                var text = root.TryGetProperty("text", out var textEl)
                    ? EnforceOutputLimit(textEl.GetString() ?? string.Empty)
                    : root.TryGetProperty("content", out var contentEl)
                        ? EnforceOutputLimit(contentEl.GetString() ?? string.Empty)
                        : string.Empty;

                if (root.TryGetProperty("slides", out var slidesEl) && slidesEl.ValueKind == JsonValueKind.Array)
                {
                    var slides = slidesEl.EnumerateArray()
                        .Select(item => item.GetString() ?? string.Empty)
                        .Where(item => !string.IsNullOrWhiteSpace(item))
                        .Select(EnforceOutputLimit)
                        .ToList();
                    return JsonSerializer.Serialize(new { text, slides, format = "carousel" });
                }

                if (!string.IsNullOrWhiteSpace(text))
                    return JsonSerializer.Serialize(new { text });
            }
        }
        catch
        {
            // fall through
        }

        return JsonSerializer.Serialize(new { text = EnforceOutputLimit(generated.Trim()) });
    }

    private static LocalAiBrandContext MapLocalBrandContext(TeamBrandStudio brandStudio)
    {
        return new LocalAiBrandContext(
            brandStudio.BrandName,
            brandStudio.WebsiteUrl,
            brandStudio.Slogan,
            brandStudio.EnrichedBrandArchetype,
            brandStudio.ToneOfVoice,
            brandStudio.AudienceSignals,
            brandStudio.ContentPillars,
            brandStudio.BrandSummary ?? brandStudio.DefaultBrandSummary);
    }

    private static string MapPlatformForLocalAi(SocialPlatform? platform)
    {
        return platform switch
        {
            SocialPlatform.Instagram => "instagram",
            SocialPlatform.Facebook => "facebook",
            SocialPlatform.LinkedIn => "linkedin",
            SocialPlatform.X => "x",
            _ => "linkedin"
        };
    }

    private static string BuildPlatformHint(SocialPlatform? platform)
    {
        if (platform is null)
            return "Platform: general social post.";

        return platform switch
        {
            SocialPlatform.LinkedIn => "Platform: LinkedIn professional post.",
            SocialPlatform.Facebook => "Platform: Facebook feed post.",
            SocialPlatform.Instagram => "Platform: Instagram caption.",
            SocialPlatform.X => "Platform: X/Twitter short post.",
            _ => $"Platform: {platform}."
        };
    }

    private static string BuildFormatHint(string? format)
    {
        if (string.Equals(format, "carousel", StringComparison.OrdinalIgnoreCase))
        {
            return "Format: Instagram carousel with 3-5 concise slides plus a caption in the text field.";
        }

        return "Format: single social post.";
    }

    private static SuggestCampaignResponseDto ParseCampaignSuggestion(string generated, SuggestCampaignRequestDto dto)
    {
        try
        {
            using var doc = JsonDocument.Parse(ExtractJson(generated));
            var root = doc.RootElement;
            var posts = new List<SuggestedCampaignPostDto>();

            if (root.TryGetProperty("posts", out var postsElement))
            {
                var index = 0;
                foreach (var post in postsElement.EnumerateArray())
                {
                    var title = post.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? $"Post {index + 1}" : $"Post {index + 1}";
                    var text = post.TryGetProperty("text", out var textEl) ? textEl.GetString() ?? "" : "";
                    var platform = dto.Platforms.ElementAtOrDefault(index % dto.Platforms.Count);
                    var scheduledAt = dto.StartDate.AddDays(index * Math.Max(1, (dto.EndDate - dto.StartDate).Days / Math.Max(postsElement.GetArrayLength(), 1)));

                    posts.Add(new SuggestedCampaignPostDto(
                        title,
                        JsonSerializer.Serialize(new { text = EnforceOutputLimit(text) }),
                        ContentType.LinkedInPost,
                        scheduledAt,
                        platform));
                    index++;
                }
            }

            if (posts.Count > 0)
            {
                return new SuggestCampaignResponseDto(
                    root.TryGetProperty("campaignName", out var name) ? name.GetString() ?? "AI Campaign" : "AI Campaign",
                    root.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
                    posts,
                    new CampaignStepStatusDto("strategy", "completed", null, "Generated", null),
                    new CampaignStepStatusDto("planning", "completed", null, "Generated", null),
                    new CampaignStepStatusDto("campaign", "completed", null, "Generated", null),
                    [],
                    Guid.NewGuid().ToString("N"));
            }
        }
        catch
        {
            // fall through
        }

        return BuildFallbackCampaign(dto);
    }

    private static SuggestCampaignResponseDto BuildFallbackCampaign(SuggestCampaignRequestDto dto)
    {
        var posts = new List<SuggestedCampaignPostDto>();
        var spanDays = Math.Max(1, (dto.EndDate - dto.StartDate).Days);
        for (var i = 0; i < 3; i++)
        {
            var platform = dto.Platforms.ElementAtOrDefault(i % dto.Platforms.Count);
            posts.Add(new SuggestedCampaignPostDto(
                $"Campaign post {i + 1}",
                JsonSerializer.Serialize(new { text = $"Planned update for: {dto.Goal}" }),
                ContentType.LinkedInPost,
                dto.StartDate.AddDays(i * (spanDays / 3)),
                platform));
        }

        return new SuggestCampaignResponseDto(
            $"Campaign: {dto.Goal}",
            $"Suggested campaign for channel {dto.ChannelId}",
            posts,
            new CampaignStepStatusDto("strategy", "completed", null, "Fallback strategy", null),
            new CampaignStepStatusDto("planning", "completed", null, "Fallback planning", null),
            new CampaignStepStatusDto("campaign", "completed", null, "Fallback campaign", null),
            [],
            Guid.NewGuid().ToString("N"));
    }

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start)
            throw new InvalidOperationException("No JSON found in AI response.");

        return text[start..(end + 1)];
    }

    private void EnsureWithinTeamDailyBudget(Guid teamId)
    {
        var key = $"{teamId:N}:{DateTime.UtcNow:yyyyMMdd}";
        var count = DailyRequestCounter.AddOrUpdate(key, 1, (_, current) => current + 1);
        var dailyLimit = _configuration.GetValue("AI:DailyRequestLimitPerTeam", DefaultDailyLimitPerTeam);
        if (count > dailyLimit)
            throw new InvalidOperationException("Daily AI budget reached for this team. Please try again tomorrow.");
    }

    private void ValidatePrompt(string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            throw new InvalidOperationException("Prompt is required.");

        var maxLength = _configuration.GetValue("AI:MaxPromptLength", DefaultMaxPromptLength);
        if (prompt.Length > maxLength)
            throw new InvalidOperationException($"Prompt exceeds maximum length of {maxLength} characters.");
    }

    private void LogAIMetrics(string operation, Guid teamId, string model, string prompt, string output)
    {
        var estimatedInputTokens = Math.Max(1, (int)Math.Ceiling(prompt.Length / 4.0));
        var estimatedOutputTokens = Math.Max(1, (int)Math.Ceiling(output.Length / 4.0));
        _logger.LogInformation(
            "AI operation completed. Operation={Operation} TeamId={TeamId} Model={Model} EstimatedInputTokens={InputTokens} EstimatedOutputTokens={OutputTokens}",
            operation,
            teamId,
            model,
            estimatedInputTokens,
            estimatedOutputTokens);
    }

    private static string EnforceOutputLimit(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        return text.Length <= DefaultMaxOutputLength
            ? text
            : text[..DefaultMaxOutputLength].TrimEnd();
    }

    private static string BuildOrgId(Guid teamId) => $"team_{teamId:N}";

    private bool IsExternalProviderMode()
    {
        var mode = _configuration["AI:ProviderMode"] ?? "LocalBackend";
        return string.Equals(mode, "ExternalProviders", StringComparison.OrdinalIgnoreCase);
    }

    private static int ComputePostsPerWeek(DateTime startDate, DateTime endDate)
    {
        var days = Math.Max(1, (endDate - startDate).Days + 1);
        var estimate = (int)Math.Ceiling(days / 7.0) * 3;
        return Math.Clamp(estimate, 2, 14);
    }

    private static string ExtractContentText(JsonElement payload)
    {
        if (payload.ValueKind == JsonValueKind.Object)
        {
            if (payload.TryGetProperty("content", out var content))
                return content.GetString() ?? string.Empty;
            if (payload.TryGetProperty("text", out var text))
                return text.GetString() ?? string.Empty;
            if (payload.TryGetProperty("generated_content", out var generated))
                return generated.GetString() ?? string.Empty;
            if (payload.TryGetProperty("reviewed_content", out var reviewed))
                return reviewed.GetString() ?? string.Empty;
            if (payload.TryGetProperty("post", out var post))
                return post.GetString() ?? string.Empty;
        }
        return payload.ToString();
    }

    private static int? GetInt(JsonElement payload, string propertyName)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty(propertyName, out var value))
            return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var intValue))
            return intValue;
        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var parsed))
            return parsed;
        return null;
    }

    private static string? GetString(JsonElement payload, string propertyName)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty(propertyName, out var value))
            return null;
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.ToString(),
            _ => null
        };
    }

    private static List<SuggestedCampaignPostDto> ExtractPosts(JsonElement payload, SuggestCampaignRequestDto dto)
    {
        JsonElement postsElement;
        if (payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("posts", out postsElement))
            return MapPosts(postsElement, dto);
        if (payload.ValueKind == JsonValueKind.Array)
            return MapPosts(payload, dto);
        return [];
    }

    private static List<SuggestedCampaignPostDto> MapPosts(JsonElement postsElement, SuggestCampaignRequestDto dto)
    {
        if (postsElement.ValueKind != JsonValueKind.Array)
            return [];

        var results = new List<SuggestedCampaignPostDto>();
        var index = 0;
        foreach (var post in postsElement.EnumerateArray())
        {
            var title = GetString(post, "title") ?? $"Post {index + 1}";
            var text = GetString(post, "text")
                ?? GetString(post, "content")
                ?? GetString(post, "body")
                ?? string.Empty;
            var contentType = ParseContentType(GetString(post, "content_type"));
            var platform = ParsePlatform(GetString(post, "platform"), dto, index);
            var scheduledAt = ParseDateTime(GetString(post, "scheduled_at")) ?? dto.StartDate.AddDays(index);
            results.Add(new SuggestedCampaignPostDto(
                title,
                JsonSerializer.Serialize(new { text = EnforceOutputLimit(text) }),
                contentType,
                scheduledAt,
                platform));
            index++;
        }
        return results;
    }

    private static ContentType ParseContentType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return ContentType.LinkedInPost;
        if (Enum.TryParse<ContentType>(value, true, out var parsed))
            return parsed;
        return value.ToLowerInvariant() switch
        {
            "instagram" => ContentType.InstagramPost,
            "facebook" => ContentType.FacebookPost,
            _ => ContentType.LinkedInPost
        };
    }

    private static SocialPlatform ParsePlatform(string? value, SuggestCampaignRequestDto dto, int index)
    {
        if (!string.IsNullOrWhiteSpace(value) && Enum.TryParse<SocialPlatform>(value, true, out var parsed))
            return parsed;
        return dto.Platforms.ElementAtOrDefault(index % Math.Max(1, dto.Platforms.Count));
    }

    private static DateTime? ParseDateTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        return DateTime.TryParse(value, out var parsed) ? DateTime.SpecifyKind(parsed, DateTimeKind.Utc) : null;
    }
}
