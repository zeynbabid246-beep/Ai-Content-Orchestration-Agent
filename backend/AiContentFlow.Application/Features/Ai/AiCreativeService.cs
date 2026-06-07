using System.Text.Json;
using System.Text.Json.Nodes;
using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Ai.Dtos;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Application.Features.Ai;

public class AiCreativeService : IAiCreativeService
{
    private readonly ITeamRepository _teamRepository;
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly IContentPostService _contentPostService;
    private readonly ILocalAiBackendClient _localAiBackendClient;
    private readonly IAiCreativeAssetImporter _assetImporter;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiCreativeService> _logger;

    public AiCreativeService(
        ITeamRepository teamRepository,
        IBrandStudioRepository brandStudioRepository,
        IContentPostService contentPostService,
        ILocalAiBackendClient localAiBackendClient,
        IAiCreativeAssetImporter assetImporter,
        IConfiguration configuration,
        ILogger<AiCreativeService> logger)
    {
        _teamRepository = teamRepository;
        _brandStudioRepository = brandStudioRepository;
        _contentPostService = contentPostService;
        _localAiBackendClient = localAiBackendClient;
        _assetImporter = assetImporter;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GeneratePostCreativeResponseDto> GenerateForPostAsync(
        Guid teamId,
        string requestingUserId,
        GeneratePostCreativeRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        if (IsExternalProviderMode())
        {
            throw new InvalidOperationException(
                "Post creative generation requires LocalBackend provider mode. Set AI:ProviderMode to LocalBackend in configuration.");
        }

        var post = await _contentPostService.GetByIdAsync(teamId, dto.ContentPostId, requestingUserId);
        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        var orgId = ResolveOrgId(teamId, brandStudio);
        var platform = ResolvePlatform(dto.Platform, post);
        var correlationId = Guid.NewGuid().ToString("N");

        var coreResult = await GenerateCreativeCoreAsync(
            teamId,
            post.ContentJson,
            platform,
            dto.Language,
            dto.VisualDirection,
            brandStudio,
            orgId,
            post.CampaignId,
            post.Id,
            source: "aicontentflow_post_editor",
            correlationId,
            cancellationToken);

        var updatedContentJson = post.ContentJson;
        if (dto.PersistToPost)
        {
            updatedContentJson = coreResult.ContentJson;

            var updateDto = new UpdateContentPostDto(
                ChannelId: post.ChannelId,
                CampaignId: post.CampaignId,
                Title: post.Title,
                ContentType: post.ContentType,
                ContentJson: updatedContentJson,
                Status: post.Status,
                Prompt: post.Prompt,
                AiModel: post.AiModel,
                AiTokens: post.AiTokens,
                PostVariants: post.PostVariants
                    .Select(v => new UpdatePostVariantDto(v.Platform, v.ContentJson, v.Title))
                    .ToList(),
                ImageUrl: coreResult.PosterUrl ?? post.ImageUrl);

            await _contentPostService.UpdateAsync(teamId, post.Id, requestingUserId, updateDto);
        }

        return new GeneratePostCreativeResponseDto(
            ContentPostId: post.Id,
            CreativeMode: coreResult.CreativeMode,
            PosterUrl: coreResult.PosterUrl,
            CarouselAssets: coreResult.CarouselAssets,
            CreativeError: coreResult.CreativeError,
            ContentJson: dto.PersistToPost ? updatedContentJson : coreResult.ContentJson,
            CorrelationId: correlationId);
    }

    public async Task<GenerateCreativePreviewResponseDto> GeneratePreviewAsync(
        Guid teamId,
        string requestingUserId,
        GenerateCreativePreviewRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        if (IsExternalProviderMode())
        {
            throw new InvalidOperationException(
                "Creative preview requires LocalBackend provider mode. Set AI:ProviderMode to LocalBackend in configuration.");
        }

        var brandStudio = await _brandStudioRepository.GetByTeamAsync(teamId);
        var orgId = ResolveOrgId(teamId, brandStudio);
        var correlationId = Guid.NewGuid().ToString("N");

        try
        {
            var coreResult = await GenerateCreativeCoreAsync(
                teamId,
                dto.ContentJson,
                dto.Platform,
                dto.Language,
                dto.VisualDirection,
                brandStudio,
                orgId,
                campaignId: null,
                campaignPostId: null,
                source: "aicontentflow_quick_generate",
                correlationId,
                cancellationToken);

            return new GenerateCreativePreviewResponseDto(
                coreResult.CreativeMode,
                coreResult.PosterUrl,
                coreResult.CarouselAssets,
                coreResult.CreativeError,
                coreResult.ContentJson,
                correlationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Creative preview generation failed for team {TeamId}", teamId);
            var platformKey = MapPlatformForLocalAi(dto.Platform);
            var mergedJson = CreativeContentJsonMapper.MergeCreativeAssets(
                dto.ContentJson,
                platformKey,
                posterUrl: null,
                carouselAssets: Array.Empty<string>(),
                creativeError: ex.Message);

            return new GenerateCreativePreviewResponseDto(
                CreativeMode: "none",
                PosterUrl: null,
                CarouselAssets: Array.Empty<string>(),
                CreativeError: ex.Message,
                ContentJson: mergedJson,
                CorrelationId: correlationId);
        }
    }

    private async Task<CreativeCoreResult> GenerateCreativeCoreAsync(
        Guid teamId,
        string contentJson,
        SocialPlatform platform,
        string language,
        string? visualDirectionOverride,
        TeamBrandStudio? brandStudio,
        string orgId,
        int? campaignId,
        int? campaignPostId,
        string source,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var root = ParseContentRoot(contentJson);
        var isCarousel = CreativeContentJsonMapper.IsCarouselMode(root, ContentType.LinkedInPost);
        var postContent = CreativeContentJsonMapper.BuildPostContent(root, null);
        var platformKey = MapPlatformForLocalAi(platform);
        var contentTypeLabel = CreativeContentJsonMapper.ResolveContentTypeLabel(root, isCarousel);
        var visualDirection = CreativeContentJsonMapper.ResolveVisualDirection(root, visualDirectionOverride);
        var brandContext = BuildBrandContextPayload(brandStudio);

        var requestBody = new
        {
            org_id = orgId,
            campaign_id = campaignId,
            campaign_post_id = campaignPostId,
            source,
            platform = platformKey,
            language,
            content_type = contentTypeLabel,
            post_type = contentTypeLabel,
            type = isCarousel ? "carousel_post" : "poster_post",
            post_content = postContent,
            brand_context = brandContext ?? new { },
            visual_direction = visualDirection,
            size = isCarousel ? "square" : (string?)null,
            use_stability = true
        };

        JsonElement aiResponse;
        string creativeMode;
        if (isCarousel)
        {
            creativeMode = "carousel";
            aiResponse = await _localAiBackendClient.GenerateCarouselAsync(
                requestBody,
                correlationId,
                cancellationToken);
        }
        else
        {
            creativeMode = "poster";
            aiResponse = await _localAiBackendClient.GeneratePosterAsync(
                requestBody,
                correlationId,
                cancellationToken);
        }

        var status = GetString(aiResponse, "status");
        if (!string.Equals(status, "success", StringComparison.OrdinalIgnoreCase))
        {
            var message = GetString(aiResponse, "message") ?? "Creative generation failed.";
            throw new InvalidOperationException(message);
        }

        var rawPosterUrl = GetString(aiResponse, "poster_url")
                           ?? GetString(aiResponse, "creative_asset_url");
        var rawCarouselAssets = ExtractStringArray(aiResponse, "carousel_assets");

        string? importedPoster = null;
        IReadOnlyList<string> importedCarousel = Array.Empty<string>();

        if (rawCarouselAssets.Count > 0)
            importedCarousel = await _assetImporter.ImportManyAsync(teamId, rawCarouselAssets, cancellationToken);

        if (!string.IsNullOrWhiteSpace(rawPosterUrl))
            importedPoster = await _assetImporter.ImportFromUrlAsync(teamId, rawPosterUrl, cancellationToken);
        else if (importedCarousel.Count > 0)
            importedPoster = importedCarousel[0];

        var mergedContentJson = CreativeContentJsonMapper.MergeCreativeAssets(
            contentJson,
            platformKey,
            importedPoster,
            importedCarousel,
            creativeError: null);

        return new CreativeCoreResult(
            creativeMode,
            importedPoster,
            importedCarousel,
            CreativeError: null,
            mergedContentJson,
            correlationId);
    }

    private sealed record CreativeCoreResult(
        string CreativeMode,
        string? PosterUrl,
        IReadOnlyList<string> CarouselAssets,
        string? CreativeError,
        string ContentJson,
        string CorrelationId);

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can use AI features");
    }

    private bool IsExternalProviderMode()
    {
        var mode = _configuration["AI:ProviderMode"] ?? "LocalBackend";
        return string.Equals(mode, "ExternalProviders", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveOrgId(Guid teamId, TeamBrandStudio? brandStudio)
        => !string.IsNullOrWhiteSpace(brandStudio?.OrgId)
            ? brandStudio!.OrgId!.Trim()
            : $"team_{teamId:N}";

    private static JsonObject ParseContentRoot(string contentJson)
    {
        try
        {
            return JsonNode.Parse(contentJson) as JsonObject ?? new JsonObject();
        }
        catch
        {
            return new JsonObject { ["text"] = contentJson.Trim() };
        }
    }

    private static SocialPlatform ResolvePlatform(SocialPlatform? requested, ContentPostResponseDto post)
    {
        if (requested.HasValue)
            return requested.Value;

        return post.PostVariants.FirstOrDefault()?.Platform ?? SocialPlatform.LinkedIn;
    }

    private static string MapPlatformForLocalAi(SocialPlatform platform)
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

    private static object? BuildBrandContextPayload(TeamBrandStudio? brandStudio)
    {
        if (brandStudio is null)
            return null;

        return new
        {
            brand_name = brandStudio.BrandName,
            website_url = brandStudio.WebsiteUrl,
            slogan = brandStudio.Slogan,
            archetype = brandStudio.EnrichedBrandArchetype,
            tone_of_voice = brandStudio.ToneOfVoice,
            audience_signals = brandStudio.AudienceSignals,
            content_pillars = brandStudio.ContentPillars,
            brand_summary = brandStudio.BrandSummary ?? brandStudio.DefaultBrandSummary,
            logo_url = BrandVisualIdentityHelper.ResolvePrimaryLogoUrl(brandStudio) ?? string.Empty,
            favicon_url = brandStudio.VisualFaviconUrl ?? string.Empty,
            has_logo = BrandVisualIdentityHelper.HasPrimaryBrandMark(brandStudio),
            visual_identity = BrandVisualIdentityHelper.BuildVisualIdentityPayload(brandStudio)
        };
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

    private static IReadOnlyList<string> ExtractStringArray(JsonElement payload, string propertyName)
    {
        if (payload.ValueKind != JsonValueKind.Object
            || !payload.TryGetProperty(propertyName, out var value)
            || value.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<string>();
        }

        return value.EnumerateArray()
            .Select(item => item.GetString())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .ToList();
    }
}
