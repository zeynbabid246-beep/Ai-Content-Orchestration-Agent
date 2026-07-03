using System.Collections.Concurrent;
using System.Text.Json;
using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Ai.Dtos;
using AiContentFlow.Domain.Campaigns.Dtos;
using AiContentFlow.Domain.Campaigns.Interfaces;
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
    private readonly ICampaignService _campaignService;
    private readonly ITextGenerationService _textGenerationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiContentService> _logger;

    public AiContentService(
        ITeamRepository teamRepository,
        IBrandStudioRepository brandStudioRepository,
        IChannelRepository channelRepository,
        ILocalAiBackendClient localAiBackendClient,
        ICampaignService campaignService,
        ITextGenerationService textGenerationService,
        IConfiguration configuration,
        ILogger<AiContentService> logger)
    {
        _teamRepository = teamRepository;
        _brandStudioRepository = brandStudioRepository;
        _channelRepository = channelRepository;
        _localAiBackendClient = localAiBackendClient;
        _campaignService = campaignService;
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

        if (dto.UseBrandContext && !IsExternalProviderMode())
            await SyncBrandToAiInternalAsync(teamId);

        var brandContext = dto.UseBrandContext
            ? await BuildBrandContextAsync(teamId, dto.ChannelId)
            : "No brand context requested.";

        var formatHint = BuildFormatHint(dto.Format);
        var platformHint = BuildPlatformHint(dto.Platform);
        var contentOptionsHint = BuildContentOptionsHint(dto.IncludeHashtags, dto.IncludeCta, dto.IncludeEmojis);
        var postTypeMetadata = QuickGeneratePostTypeMapper.Resolve(dto.PostType);
        var visualTypeHint = QuickGeneratePromptBuilder.BuildVisualTypePromptHint(dto.PostType);
        var language = string.IsNullOrWhiteSpace(dto.Language) ? "English" : dto.Language.Trim();

        if (IsExternalProviderMode())
        {
            var model = string.IsNullOrWhiteSpace(dto.Model) ? "groq" : dto.Model.Trim();
            var prompt = $"""
                Write a social media post as JSON.
                {platformHint}
                {formatHint}
                {contentOptionsHint}
                {visualTypeHint}
                {QuickGeneratePromptBuilder.BuildLanguageHint(language)}
                Required JSON shape:
                - For standard posts: an object with a "text" field
                - For carousels: an object with "text" and "slides" array fields
                Prompt: {dto.Prompt}
                Brand context:
                {brandContext}
                Return only JSON.
                """;
            var generated = await _textGenerationService.GenerateTextAsync(prompt, model, AiUseCase.GeneratePost);
            var contentJsonExternal = dto.PostType != QuickGeneratePostType.TextOnly
                ? WrapQuickGenerateContent(generated, postTypeMetadata, dto.IncludeHashtags, dto.IncludeCta)
                : NormalizeGeneratedJson(generated, dto.IncludeHashtags, dto.IncludeCta);
            LogAIMetrics("generate-post-external", teamId, model, prompt, contentJsonExternal);
            return new GeneratePostResponseDto(contentJsonExternal, model, null);
        }

        var correlationId = Guid.NewGuid().ToString("N");
        var brandStudioForOrg = await _brandStudioRepository.GetByTeamAsync(teamId);
        var orgId = ResolveOrgId(teamId, brandStudioForOrg);
        var platform = MapPlatformForLocalAi(dto.Platform);
        var mode = "prompt_only";
        LocalAiBrandContext? localBrandContext = null;

        if (dto.UseBrandContext)
        {
            if (brandStudioForOrg is not null)
            {
                mode = "manual_brand";
                localBrandContext = MapLocalBrandContext(brandStudioForOrg);
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
            {contentOptionsHint}
            {visualTypeHint}
            {QuickGeneratePromptBuilder.BuildLanguageHint(language)}
            """;

        var orchestratorMetadata = new LocalAiOrchestratorMetadata(
            postTypeMetadata.ContentType,
            postTypeMetadata.PostType,
            postTypeMetadata.InternalType,
            postTypeMetadata.NeedsCreative);

        var aiResponse = await _localAiBackendClient.GenerateContentAsync(
            mode,
            mode == "prompt_only" ? null : orgId,
            aiPrompt,
            [platform],
            language,
            localBrandContext,
            correlationId,
            orchestratorMetadata);

        var rawContent = ExtractContentText(aiResponse);
        var contentJson = dto.PostType != QuickGeneratePostType.TextOnly
            ? WrapQuickGenerateContent(rawContent, postTypeMetadata, dto.IncludeHashtags, dto.IncludeCta)
            : NormalizeGeneratedJson(rawContent, dto.IncludeHashtags, dto.IncludeCta);
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
        await EnsureAiBrandForCampaignAsync(teamId);

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
        var (orgId, brandStudio) = await ResolveLockedBrandAsync(teamId);
        var platforms = dto.Platforms.Select(p => p.ToString()).ToList();
        var postsPerWeek = dto.PostsPerWeek ?? ComputePostsPerWeek(dto.StartDate, dto.EndDate);
        var language = string.IsNullOrWhiteSpace(dto.Language) ? "English" : dto.Language;
        var theme = !string.IsNullOrWhiteSpace(dto.Theme) ? dto.Theme.Trim() : $"{channel.Name} | {dto.Goal}";
        var primaryPlatform = !string.IsNullOrWhiteSpace(dto.PrimaryPlatform)
            ? dto.PrimaryPlatform.Trim()
            : platforms.FirstOrDefault() ?? "linkedin";
        var brandContextBody = BuildBrandContextPayload(brandStudio);
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
                theme,
                language,
                postsPerWeek,
                platforms,
                dto.CustomPrompt,
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

            var selectedDirection = ResolveFirstContentDirection(strategyPayload.Value);
            planningPayload = await _localAiBackendClient.GeneratePlanningAsync(
                strategyPayload.Value,
                strategyId.Value,
                postsPerWeek,
                platforms,
                language,
                correlationId,
                selectedDirection);
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
                strategyPayload.Value,
                planningPayload.Value,
                planningId.Value,
                orgId,
                platforms,
                primaryPlatform,
                brandContextBody,
                language,
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
            posts = ExtractPostsFromCampaignWeeks(campaignPayload.Value, dto, primaryPlatform);
            if (posts.Count == 0)
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

    public async Task<CampaignStrategyStepResponseDto> GenerateCampaignStrategyStepAsync(
        Guid teamId,
        string requestingUserId,
        CampaignAiPipelineConfigDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        EnsureWithinTeamDailyBudget(teamId);
        ValidatePrompt(dto.Goal);
        await EnsureAiBrandForCampaignAsync(teamId);
        var (orgId, _) = await ResolveLockedBrandAsync(teamId);
        _ = await _channelRepository.GetByIdAsync(teamId, dto.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var correlationId = Guid.NewGuid().ToString("N");
        var platforms = dto.Platforms.Select(p => p.ToString()).ToList();

        if (IsExternalProviderMode())
        {
            var brandContext = await BuildBrandContextAsync(teamId, dto.ChannelId);
            var prompt = $$"""
                Generate a social media marketing strategy as a JSON object.
                Goal: {{dto.Goal}}
                Theme: {{dto.Theme ?? dto.Goal}}
                Platforms: {{string.Join(", ", platforms)}}
                Brand context: {{brandContext}}
                Return ONLY valid JSON with these exact keys:
                {
                  "strategy_id": 1,
                  "strategy_summary": "2-3 sentence overview of the strategy",
                  "positioning": "how the brand is positioned in this campaign",
                  "target_audience": "description of target audience",
                  "pillars": ["pillar 1", "pillar 2", "pillar 3"],
                  "angles": ["angle 1", "angle 2"],
                  "content_guidelines": {
                    "tone": "tone description",
                    "style": "style description",
                    "cta_style": "CTA style description"
                  },
                  "content_direction": ["direction 1", "direction 2"]
                }
                """;
            var json = await _textGenerationService.GenerateTextAsync(prompt, "groq", AiUseCase.SuggestCampaign);
            var strategy = JsonDocument.Parse(ExtractJson(json)).RootElement.Clone();
            var strategyId = GetInt(strategy, "strategy_id") ?? 1;
            return new CampaignStrategyStepResponseDto(strategyId, strategy, orgId, correlationId);
        }

        var strategy2 = await _localAiBackendClient.GenerateStrategyAsync(
            orgId,
            dto.Goal,
            dto.Theme,
            dto.Language,
            dto.PostsPerWeek,
            platforms,
            dto.CustomPrompt,
            correlationId);

        var strategyId2 = GetInt(strategy2, "strategy_id") ?? GetInt(strategy2, "id");
        if (!strategyId2.HasValue)
            throw new InvalidOperationException("Strategy step did not return strategy_id.");

        return new CampaignStrategyStepResponseDto(strategyId2, strategy2, orgId, correlationId);
    }

    public async Task<CampaignPlanningStepResponseDto> GenerateCampaignPlanningStepAsync(
        Guid teamId,
        string requestingUserId,
        CampaignPlanningStepRequestDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        EnsureWithinTeamDailyBudget(teamId);
        await EnsureAiBrandForCampaignAsync(teamId);
        _ = await ResolveLockedBrandAsync(teamId);

        var correlationId = Guid.NewGuid().ToString("N");
        var platforms = dto.Config.Platforms.Select(p => p.ToString()).ToList();

        if (IsExternalProviderMode())
        {
            var postsPerWeek = dto.Config.PostsPerWeek;
            var prompt = $$"""
                Generate a social media content planning calendar as a JSON object.
                Goal: {{dto.Config.Goal}}
                Platforms: {{string.Join(", ", platforms)}}
                Posts per week: {{postsPerWeek}}
                Number of weeks: 2
                Return ONLY valid JSON with these exact keys:
                {
                  "planning_id": 1,
                  "weeks": [
                    {
                      "week": 1,
                      "focus": "theme for week 1",
                      "days": [
                        {
                          "day": "Monday",
                          "topic": "topic title",
                          "content_type": "linkedin-post",
                          "description": "brief description"
                        }
                      ]
                    }
                  ]
                }
                Generate {{postsPerWeek}} days per week across 2 weeks. Use platforms: {{string.Join(", ", platforms)}}.
                """;
            var json = await _textGenerationService.GenerateTextAsync(prompt, "groq", AiUseCase.SuggestCampaign);
            var planning = JsonDocument.Parse(ExtractJson(json)).RootElement.Clone();
            var planningId = GetInt(planning, "planning_id") ?? 1;
            return new CampaignPlanningStepResponseDto(planningId, planning, correlationId);
        }

        var selectedDirection = dto.SelectedContentDirection ?? ResolveFirstContentDirection(dto.Strategy);
        var planning2 = await _localAiBackendClient.GeneratePlanningAsync(
            dto.Strategy,
            dto.StrategyId,
            dto.Config.PostsPerWeek,
            platforms,
            dto.Config.Language,
            correlationId,
            selectedDirection,
            dto.DirectionMode);

        var planningId2 = GetInt(planning2, "planning_id") ?? GetInt(planning2, "id");
        if (!planningId2.HasValue)
            throw new InvalidOperationException("Planning step did not return planning_id.");

        return new CampaignPlanningStepResponseDto(planningId2, planning2, correlationId);
    }

    public async Task<CampaignContentStepResponseDto> GenerateCampaignContentStepAsync(
        Guid teamId,
        string requestingUserId,
        CampaignContentStepRequestDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        EnsureWithinTeamDailyBudget(teamId);
        await EnsureAiBrandForCampaignAsync(teamId);
        var (orgId, brandStudio) = await ResolveLockedBrandAsync(teamId);
        var channel = await _channelRepository.GetByIdAsync(teamId, dto.Config.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var correlationId = Guid.NewGuid().ToString("N");
        var platforms = dto.Config.Platforms.Select(p => p.ToString()).ToList();
        var primaryPlatform = !string.IsNullOrWhiteSpace(dto.Config.PrimaryPlatform)
            ? dto.Config.PrimaryPlatform.Trim()
            : platforms.FirstOrDefault() ?? "linkedin";

        if (IsExternalProviderMode())
        {
            var brandContext = await BuildBrandContextAsync(teamId, dto.Config.ChannelId);
            var externalSuggestDto = new SuggestCampaignRequestDto(
                dto.Config.ChannelId,
                dto.Config.Goal,
                dto.Config.StartDate,
                dto.Config.EndDate,
                dto.Config.Platforms,
                Theme: dto.Config.Theme,
                Language: dto.Config.Language,
                PostsPerWeek: dto.Config.PostsPerWeek,
                CustomPrompt: dto.Config.CustomPrompt,
                PrimaryPlatform: primaryPlatform);
            var prompt = $"""
                Generate a social media campaign as JSON.
                Goal: {dto.Config.Goal}
                Platforms: {string.Join(", ", platforms)}
                Brand context: {brandContext}
                Date range: {dto.Config.StartDate:O} to {dto.Config.EndDate:O}
                Return ONLY a JSON object with keys: campaign_name, description, posts (array with title, text, contentType, scheduledAt ISO-8601, platform).
                """;
            var json = await _textGenerationService.GenerateTextAsync(prompt, "groq", AiUseCase.SuggestCampaign);
            var suggestion = ParseCampaignSuggestion(json, externalSuggestDto);
            var campaignJson = JsonDocument.Parse(ExtractJson(json)).RootElement.Clone();
            return new CampaignContentStepResponseDto(
                1,
                campaignJson,
                suggestion.Posts,
                suggestion.CampaignName,
                suggestion.Description,
                correlationId);
        }

        var brandContextBody = BuildBrandContextPayload(brandStudio);

        var campaign = await _localAiBackendClient.GenerateCampaignContentAsync(
            dto.Strategy,
            dto.Planning,
            dto.PlanningId,
            orgId,
            platforms,
            primaryPlatform,
            brandContextBody,
            dto.Config.Language,
            correlationId);

        var suggestDto = new SuggestCampaignRequestDto(
            dto.Config.ChannelId,
            dto.Config.Goal,
            dto.Config.StartDate,
            dto.Config.EndDate,
            dto.Config.Platforms,
            Theme: dto.Config.Theme,
            Language: dto.Config.Language,
            PostsPerWeek: dto.Config.PostsPerWeek,
            CustomPrompt: dto.Config.CustomPrompt,
            PrimaryPlatform: primaryPlatform);

        var posts = ExtractPostsFromCampaignWeeks(campaign, suggestDto, primaryPlatform);
        if (posts.Count == 0)
            posts = ExtractPosts(campaign, suggestDto);

        var campaignName = GetString(campaign, "campaign_name")
            ?? GetString(dto.Strategy, "campaign_name")
            ?? $"Campaign: {dto.Config.Goal}";
        var description = GetString(campaign, "description")
            ?? GetString(dto.Strategy, "strategy_summary")
            ?? $"Generated for {channel.Name}";

        return new CampaignContentStepResponseDto(
            GetInt(campaign, "campaign_id") ?? GetInt(campaign, "id"),
            campaign,
            posts,
            campaignName,
            description,
            correlationId);
    }

    public async Task<MaterializeCampaignResponseDto> MaterializeCampaignAsync(
        Guid teamId,
        string requestingUserId,
        MaterializeCampaignRequestDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        await EnsureAiBrandForCampaignAsync(teamId);

        SuggestCampaignResponseDto suggestion;
        if (dto.RunSuggest || dto.Posts is null || dto.Posts.Count == 0)
        {
            suggestion = await SuggestCampaignAsync(
                teamId,
                requestingUserId,
                new SuggestCampaignRequestDto(
                    dto.ChannelId,
                    dto.Goal,
                    dto.StartDate,
                    dto.EndDate,
                    dto.Platforms,
                    dto.OrgId,
                    dto.Theme,
                    dto.Language,
                    dto.PostsPerWeek,
                    dto.CustomPrompt,
                    dto.PrimaryPlatform));

            if (suggestion.Errors.Count > 0 && suggestion.Posts.All(p =>
                    p.ContentJson.Contains("\"source\":\"ai_campaign\"") is false
                    || p.Title.StartsWith("Campaign post ", StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException(
                    $"AI campaign generation failed: {string.Join("; ", suggestion.Errors)}");
            }
        }
        else
        {
            var posts = dto.Posts
                .Select(p => new SuggestedCampaignPostDto(
                    p.Title,
                    p.ContentJson,
                    p.ContentType,
                    p.ScheduledAt,
                    p.Platform))
                .ToList();
            suggestion = new SuggestCampaignResponseDto(
                dto.CampaignName ?? $"Campaign: {dto.Goal}",
                dto.Description ?? dto.Goal,
                posts,
                new CampaignStepStatusDto("strategy", "skipped", null, null, null),
                new CampaignStepStatusDto("planning", "skipped", null, null, null),
                new CampaignStepStatusDto("campaign", "skipped", null, null, null),
                [],
                Guid.NewGuid().ToString("N"));
        }

        var campaignName = dto.CampaignName ?? suggestion.CampaignName;
        var description = dto.Description ?? suggestion.Description;

        int campaignId;
        if (dto.ExistingCampaignId.HasValue)
        {
            campaignId = dto.ExistingCampaignId.Value;
            _ = await _campaignService.GetByIdAsync(teamId, campaignId, requestingUserId);
        }
        else
        {
            var created = await _campaignService.CreateAsync(
                teamId,
                requestingUserId,
                new CreateCampaignDto(
                    campaignName,
                    description,
                    dto.ChannelId,
                    dto.Goal));
            campaignId = created.Id;
        }

        var bulkItems = suggestion.Posts
            .Select(post =>
            {
                int? socialAccountId = null;
                if (dto.SchedulePosts && dto.SocialAccountIdByPlatform is not null)
                {
                    var key = post.Platform.ToString();
                    if (dto.SocialAccountIdByPlatform.TryGetValue(key, out var id))
                        socialAccountId = id;
                }

                return new BulkCampaignPostItemDto(
                    post.Title,
                    post.ContentJson,
                    post.ContentType,
                    dto.SchedulePosts ? post.ScheduledAt : null,
                    socialAccountId,
                    post.Platform);
            })
            .ToList();

        var bulkResult = await _campaignService.BulkCreatePostsAsync(
            teamId,
            campaignId,
            requestingUserId,
            new BulkCreateCampaignPostsDto(bulkItems));

        var metadata = JsonSerializer.Serialize(new
        {
            correlationId = suggestion.CorrelationId,
            strategyId = suggestion.Strategy.Id,
            planningId = suggestion.Planning.Id,
            generatedAt = DateTime.UtcNow
        });
        await _campaignService.SetAiGenerationMetadataAsync(teamId, campaignId, metadata);

        return new MaterializeCampaignResponseDto(
            campaignId,
            bulkResult.ContentPostIds,
            suggestion.CorrelationId,
            suggestion.Strategy,
            suggestion.Planning,
            suggestion.Campaign,
            suggestion.Errors);
    }

    public async Task SyncBrandToAiAsync(Guid teamId, string requestingUserId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        await SyncBrandToAiInternalAsync(teamId);
    }

    public async Task<AssistantChatResponseDto> ChatWithAssistantAsync(
        Guid teamId,
        string requestingUserId,
        AssistantChatRequestDto dto)
    {
        await EnsureTeamMemberAsync(teamId, requestingUserId);

        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new InvalidOperationException("Message is required.");

        if (IsExternalProviderMode())
        {
            throw new InvalidOperationException(
                "The AI assistant requires LocalBackend provider mode. Set AI:ProviderMode to LocalBackend in configuration.");
        }

        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        var orgId = ResolveOrgId(teamId, brandStudio);
        var context = dto.Context ?? new Dictionary<string, JsonElement>();

        var campaignId = ExtractContextId(context, "campaign_id", "campaignId");
        var strategyId = ExtractContextId(context, "strategy_id", "strategyId");
        var planningId = ExtractContextId(context, "planning_id", "planningId");

        var correlationId = Guid.NewGuid().ToString("N");
        var requestBody = new
        {
            message = dto.Message.Trim(),
            brand_id = orgId,
            campaign_id = campaignId,
            strategy_id = strategyId,
            planning_id = planningId,
            platform = "assistant_widget",
            language = dto.Language,
            context = SerializeContextForPython(context)
        };

        var aiResponse = await _localAiBackendClient.AssistantChatAsync(requestBody, correlationId);
        return MapAssistantChatResponse(aiResponse, correlationId);
    }

    public async Task<AiHealthResponseDto> GetAiHealthAsync()
    {
        if (IsExternalProviderMode())
            return new AiHealthResponseDto(true, "ExternalProviders");

        var healthy = await _localAiBackendClient.GetHealthAsync();
        return new AiHealthResponseDto(healthy, "LocalBackend");
    }

    private async Task EnsureAiBrandForCampaignAsync(Guid teamId)
    {
        if (IsExternalProviderMode())
            return;

        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        if (brandStudio is null
            || (string.IsNullOrWhiteSpace(brandStudio.BrandName)
                && string.IsNullOrWhiteSpace(brandStudio.BrandSummary)
                && string.IsNullOrWhiteSpace(brandStudio.DefaultBrandSummary)))
        {
            throw new InvalidOperationException(
                "Set up Brand Studio (import a website or save a brand profile) before using AI campaigns.");
        }

        if (string.IsNullOrWhiteSpace(brandStudio.OrgId))
        {
            throw new InvalidOperationException(
                "Brand Studio must have a scraped Brand ID (org_id). Import a website and save the profile before running AI campaigns.");
        }

        await SyncBrandToAiInternalAsync(teamId, brandStudio);
    }

    private async Task<(string OrgId, TeamBrandStudio BrandStudio)> ResolveLockedBrandAsync(Guid teamId)
    {
        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId)
            ?? throw new InvalidOperationException(
                "Set up Brand Studio (import a website or save a brand profile) before using AI campaigns.");

        if (string.IsNullOrWhiteSpace(brandStudio.OrgId))
        {
            throw new InvalidOperationException(
                "Brand ID is missing. Import a website in Brand Studio and save the profile so org_id is set.");
        }

        return (brandStudio.OrgId.Trim(), brandStudio);
    }

    private async Task SyncBrandToAiInternalAsync(Guid teamId, TeamBrandStudio? brandStudio = null)
    {
        if (IsExternalProviderMode())
            return;

        brandStudio ??= await _brandStudioRepository.GetByTeamAsync(teamId);
        if (brandStudio is null)
            return;

        var correlationId = Guid.NewGuid().ToString("N");
        var orgId = ResolveOrgId(teamId, brandStudio);
        var body = LocalAiManualBrandMapper.ToApiBody(brandStudio, orgId);
        await _localAiBackendClient.ConfigureBrandManualAsync(body, correlationId);
    }

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can use AI features");
    }

    private async Task EnsureTeamMemberAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");
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

    private static string NormalizeGeneratedJson(
        string generated,
        bool includeHashtags = true,
        bool includeCta = true)
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

                if (string.IsNullOrWhiteSpace(text))
                {
                    text = BuildGeneratedContentPreview(root, includeHashtags, includeCta);
                }

                if (root.TryGetProperty("slides", out var slidesEl) && slidesEl.ValueKind == JsonValueKind.Array)
                {
                    var slides = slidesEl.EnumerateArray()
                        .Select(item => item.ValueKind == JsonValueKind.String
                            ? item.GetString() ?? string.Empty
                            : GetString(item, "text") ?? GetString(item, "title") ?? item.ToString())
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
            brandStudio.BrandSummary ?? brandStudio.DefaultBrandSummary,
            BrandVisualIdentityHelper.ResolvePrimaryLogoUrl(brandStudio),
            brandStudio.VisualFaviconUrl,
            brandStudio.VisualPrimaryColors,
            brandStudio.VisualSecondaryColors,
            brandStudio.VisualFontFamilies,
            brandStudio.VisualStyle,
            brandStudio.VisualImageUrls,
            BrandVisualIdentityHelper.HasPrimaryBrandMark(brandStudio));
    }

    private static string MapPlatformForLocalAi(SocialPlatform? platform)
    {
        return platform switch
        {
            SocialPlatform.Instagram => "instagram",
            SocialPlatform.Facebook => "facebook",
            SocialPlatform.LinkedIn => "linkedin",
            SocialPlatform.X => "x",
            SocialPlatform.Threads => "threads",
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
            SocialPlatform.Threads => "Platform: Threads short conversational post (max 500 characters).",
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

    private static string BuildContentOptionsHint(bool includeHashtags, bool includeCta, bool includeEmojis)
    {
        var lines = new List<string>
        {
            includeHashtags ? "Include relevant hashtags." : "Do not include hashtags.",
            includeCta ? "Include a clear but natural call to action." : "Do not include a call to action.",
            includeEmojis ? "Emojis are allowed in moderation." : "Do not use emojis."
        };

        return string.Join("\n", lines);
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

    private static string ResolveOrgId(Guid teamId, TeamBrandStudio? brandStudio)
        => !string.IsNullOrWhiteSpace(brandStudio?.OrgId)
            ? brandStudio!.OrgId!.Trim()
            : BuildOrgId(teamId);

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

    private static object? BuildBrandContextPayload(TeamBrandStudio? brandStudio)
    {
        if (brandStudio is null)
            return null;

        var ctx = MapLocalBrandContext(brandStudio);
        return new
        {
            brand_name = ctx.BrandName,
            website_url = ctx.WebsiteUrl,
            slogan = ctx.Slogan,
            archetype = ctx.Archetype,
            tone_of_voice = ctx.ToneOfVoice ?? Array.Empty<string>(),
            audience_signals = ctx.AudienceSignals ?? Array.Empty<string>(),
            content_pillars = ctx.ContentPillars ?? Array.Empty<string>(),
            brand_summary = ctx.BrandSummary,
            logo_url = ctx.LogoUrl ?? string.Empty,
            favicon_url = ctx.FaviconUrl ?? string.Empty,
            has_logo = ctx.HasLogo,
            visual_identity = BrandVisualIdentityHelper.BuildVisualIdentityPayload(brandStudio)
        };
    }

    private static List<SuggestedCampaignPostDto> ExtractPostsFromCampaignWeeks(
        JsonElement payload,
        SuggestCampaignRequestDto dto,
        string primaryPlatform)
    {
        if (payload.ValueKind != JsonValueKind.Object || !payload.TryGetProperty("weeks", out var weeksElement))
            return [];
        if (weeksElement.ValueKind != JsonValueKind.Array)
            return [];

        var daySlots = new List<(JsonElement Day, string? ContentTypeRaw)>();
        foreach (var week in weeksElement.EnumerateArray())
        {
            if (!week.TryGetProperty("days", out var daysElement) || daysElement.ValueKind != JsonValueKind.Array)
                continue;
            foreach (var day in daysElement.EnumerateArray())
                daySlots.Add((day, GetString(day, "content_type")));
        }

        var results = new List<SuggestedCampaignPostDto>();
        var totalDays = Math.Max(1, daySlots.Count);
        for (var index = 0; index < daySlots.Count; index++)
        {
            var day = daySlots[index].Day;
            var contentTypeRaw = daySlots[index].ContentTypeRaw;
            var title = GetString(day, "topic") ?? GetString(day, "day") ?? $"Post {index + 1}";
            var contentType = MapAiContentType(contentTypeRaw);
            var platform = ParsePlatform(primaryPlatform, dto, index);
            var scheduledAt = SpreadScheduledAt(dto.StartDate, dto.EndDate, index, totalDays);

            string contentJson;
            if (day.TryGetProperty("generated_content", out var generated))
                contentJson = WrapGeneratedContent(generated, contentTypeRaw);
            else
            {
                var description = GetString(day, "description") ?? string.Empty;
                contentJson = JsonSerializer.Serialize(new
                {
                    source = "ai_campaign",
                    preview = EnforceOutputLimit(description),
                    generated = new { text = description }
                });
            }

            results.Add(new SuggestedCampaignPostDto(
                title,
                contentJson,
                contentType,
                scheduledAt,
                platform));
        }

        return results;
    }

    private static string WrapGeneratedContent(JsonElement generated, string? plannerContentType)
    {
        var preview = BuildGeneratedContentPreview(generated);
        var wrapper = new
        {
            source = "ai_campaign",
            plannerContentType,
            aiFormat = GetString(generated, "type") ?? GetString(generated, "content_type"),
            preview,
            generated = JsonSerializer.Deserialize<object>(generated.GetRawText())
        };
        return JsonSerializer.Serialize(wrapper);
    }

    private static string WrapQuickGenerateContent(
        string generated,
        QuickGeneratePostTypeMetadata metadata,
        bool includeHashtags,
        bool includeCta)
    {
        try
        {
            var json = ExtractJson(generated);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var preview = BuildGeneratedContentPreview(root, includeHashtags, includeCta);
            var wrapper = new
            {
                source = "quick_generate",
                plannerContentType = metadata.ContentType,
                aiFormat = metadata.InternalType,
                preview,
                generated = JsonSerializer.Deserialize<object>(root.GetRawText())
            };
            return JsonSerializer.Serialize(wrapper);
        }
        catch
        {
            return NormalizeGeneratedJson(generated, includeHashtags, includeCta);
        }
    }

    private static string BuildGeneratedContentPreview(
        JsonElement generated,
        bool includeHashtags = true,
        bool includeCta = true)
    {
        if (generated.ValueKind == JsonValueKind.String)
            return EnforceOutputLimit(generated.GetString() ?? string.Empty);

        var type = (GetString(generated, "type") ?? GetString(generated, "content_type") ?? string.Empty).ToLowerInvariant();
        var parts = new List<string>();

        var hook = GetString(generated, "hook");
        var body = GetString(generated, "body");
        var cta = GetString(generated, "cta");
        if (!string.IsNullOrWhiteSpace(hook))
            parts.Add(hook);
        if (!string.IsNullOrWhiteSpace(body))
            parts.Add(body);
        if (includeCta && !string.IsNullOrWhiteSpace(cta))
            parts.Add(cta);

        var title = GetString(generated, "title");
        var intro = GetString(generated, "intro");
        if (!string.IsNullOrWhiteSpace(title))
            parts.Add(title);
        if (!string.IsNullOrWhiteSpace(intro))
            parts.Add(intro);

        if (generated.TryGetProperty("sections", out var sections) && sections.ValueKind == JsonValueKind.Array)
        {
            foreach (var section in sections.EnumerateArray())
            {
                var heading = GetString(section, "heading");
                var text = GetString(section, "text");
                if (!string.IsNullOrWhiteSpace(heading))
                    parts.Add(heading);
                if (!string.IsNullOrWhiteSpace(text))
                    parts.Add(text);
            }
        }

        if (generated.TryGetProperty("slides", out var slides) && slides.ValueKind == JsonValueKind.Array)
        {
            foreach (var slide in slides.EnumerateArray())
            {
                var slideTitle = GetString(slide, "title");
                var slideText = GetString(slide, "text");
                if (!string.IsNullOrWhiteSpace(slideTitle))
                    parts.Add($"• {slideTitle}");
                if (!string.IsNullOrWhiteSpace(slideText))
                    parts.Add(slideText);
            }
        }

        if (includeHashtags && generated.TryGetProperty("hashtags", out var hashtags) && hashtags.ValueKind == JsonValueKind.Array)
        {
            var tags = hashtags.EnumerateArray()
                .Select(item => item.GetString() ?? string.Empty)
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .ToList();
            if (tags.Count > 0)
                parts.Add(string.Join(" ", tags));
        }

        if (parts.Count > 0)
            return EnforceOutputLimit(string.Join("\n\n", parts));

        if (type.Contains("carousel") || type.Contains("infographic") || type.Contains("poster"))
        {
            var direction = GetString(generated, "creative_direction") ?? GetString(generated, "visual_direction");
            if (!string.IsNullOrWhiteSpace(direction))
                return EnforceOutputLimit(direction);
        }

        return EnforceOutputLimit(generated.GetRawText());
    }

    private static DateTime SpreadScheduledAt(DateTime start, DateTime end, int index, int total)
    {
        if (total <= 1)
            return start;
        var spanDays = Math.Max(0, (end - start).Days);
        var offset = (int)Math.Round((double)index / (total - 1) * spanDays);
        return start.AddDays(offset);
    }

    private static ContentType MapAiContentType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return ContentType.LinkedInPost;

        var normalized = value.Trim().ToLowerInvariant();
        return normalized switch
        {
            "carousel" => ContentType.LinkedInPost,
            "static image" or "image" or "poster" => ContentType.LinkedInPost,
            "infographic" => ContentType.LinkedInPost,
            "instagram" or "instagram post" => ContentType.InstagramPost,
            "facebook" or "facebook post" => ContentType.FacebookPost,
            "text post" or "text" => ContentType.LinkedInPost,
            _ => Enum.TryParse<ContentType>(value, true, out var parsed) ? parsed : ContentType.LinkedInPost
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

    private static string? ResolveFirstContentDirection(JsonElement strategy)
    {
        if (strategy.ValueKind != JsonValueKind.Object
            || !strategy.TryGetProperty("content_direction", out var directions)
            || directions.ValueKind != JsonValueKind.Array)
            return null;

        foreach (var item in directions.EnumerateArray())
        {
            var value = item.GetString();
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    private static object? ExtractContextId(
        Dictionary<string, JsonElement> context,
        params string[] keys)
    {
        foreach (var key in keys)
        {
            if (!context.TryGetValue(key, out var value))
                continue;

            if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var intValue))
                return intValue;

            if (value.ValueKind == JsonValueKind.String)
            {
                var text = value.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                    return text;
            }
        }

        return null;
    }

    private static object SerializeContextForPython(Dictionary<string, JsonElement> context)
    {
        if (context.Count == 0)
            return new { };

        return JsonSerializer.Deserialize<object>(JsonSerializer.Serialize(context))
               ?? new { };
    }

    private AssistantChatResponseDto MapAssistantChatResponse(JsonElement payload, string correlationId)
    {
        var localAiBaseUrl = (_configuration["LocalAI:BaseUrl"] ?? "http://127.0.0.1:8000").TrimEnd('/');
        var screenshots = new List<AssistantScreenshotDto>();

        if (payload.TryGetProperty("screenshots", out var screenshotsElement)
            && screenshotsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in screenshotsElement.EnumerateArray())
            {
                var title = GetString(item, "title") ?? string.Empty;
                var url = RewriteAssistantScreenshotUrl(GetString(item, "url"), localAiBaseUrl);
                var description = GetString(item, "description");
                if (!string.IsNullOrWhiteSpace(title) && !string.IsNullOrWhiteSpace(url))
                    screenshots.Add(new AssistantScreenshotDto(title, url, description));
            }
        }

        var metadata = new Dictionary<string, JsonElement>();
        if (payload.TryGetProperty("metadata", out var metadataElement)
            && metadataElement.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in metadataElement.EnumerateObject())
                metadata[property.Name] = property.Value.Clone();
        }

        var suggestedActions = new List<string>();
        if (payload.TryGetProperty("suggested_actions", out var actionsElement)
            && actionsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var action in actionsElement.EnumerateArray())
            {
                var text = action.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                    suggestedActions.Add(text);
            }
        }

        return new AssistantChatResponseDto(
            Answer: GetString(payload, "answer") ?? string.Empty,
            Intent: GetString(payload, "intent") ?? "general_question",
            BrandId: GetString(payload, "brand_id"),
            TargetAgent: GetString(payload, "target_agent"),
            NeedsBrandSelection: payload.TryGetProperty("needs_brand_selection", out var needsBrand)
                && needsBrand.ValueKind == JsonValueKind.True,
            SuggestedActions: suggestedActions,
            Language: GetString(payload, "language"),
            Screenshots: screenshots,
            Metadata: metadata,
            CorrelationId: correlationId);
    }

    private static string RewriteAssistantScreenshotUrl(string? url, string localAiBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(url))
            return string.Empty;

        const string staticPath = "/static/assistant_screenshots/";
        var pathIndex = url.IndexOf(staticPath, StringComparison.OrdinalIgnoreCase);
        if (pathIndex >= 0)
            return $"{localAiBaseUrl}{url[pathIndex..]}";

        return url;
    }
}
