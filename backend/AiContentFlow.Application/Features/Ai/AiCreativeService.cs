using System.Text.Json;
using System.Text.Json.Nodes;
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

        var root = ParseContentRoot(post.ContentJson);
        var isCarousel = CreativeContentJsonMapper.IsCarouselMode(root, post.ContentType);
        var postContent = CreativeContentJsonMapper.BuildPostContent(root, post.Title);
        var platform = ResolvePlatform(dto.Platform, post);
        var platformKey = MapPlatformForLocalAi(platform);
        var contentTypeLabel = CreativeContentJsonMapper.ResolveContentTypeLabel(root, isCarousel);
        var visualDirection = CreativeContentJsonMapper.ResolveVisualDirection(root, dto.VisualDirection);
        var brandContext = BuildBrandContextPayload(brandStudio);

        var correlationId = Guid.NewGuid().ToString("N");
        var requestBody = new
        {
            org_id = orgId,
            campaign_id = post.CampaignId,
            campaign_post_id = post.Id,
            source = "aicontentflow_post_editor",
            platform = platformKey,
            language = dto.Language,
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
        try
        {
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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Creative generation failed for post {PostId}", post.Id);
            throw;
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

        try
        {
            if (rawCarouselAssets.Count > 0)
                importedCarousel = await _assetImporter.ImportManyAsync(teamId, rawCarouselAssets, cancellationToken);

            if (!string.IsNullOrWhiteSpace(rawPosterUrl))
                importedPoster = await _assetImporter.ImportFromUrlAsync(teamId, rawPosterUrl, cancellationToken);
            else if (importedCarousel.Count > 0)
                importedPoster = importedCarousel[0];
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import creative assets for post {PostId}", post.Id);
            throw new InvalidOperationException($"Creative generated but asset import failed: {ex.Message}", ex);
        }

        var updatedContentJson = post.ContentJson;
        if (dto.PersistToPost)
        {
            updatedContentJson = CreativeContentJsonMapper.MergeCreativeAssets(
                post.ContentJson,
                platformKey,
                importedPoster,
                importedCarousel,
                creativeError: null);

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
                ImageUrl: importedPoster ?? post.ImageUrl);

            await _contentPostService.UpdateAsync(teamId, post.Id, requestingUserId, updateDto);
        }

        return new GeneratePostCreativeResponseDto(
            ContentPostId: post.Id,
            CreativeMode: creativeMode,
            PosterUrl: importedPoster,
            CarouselAssets: importedCarousel,
            CreativeError: null,
            ContentJson: updatedContentJson,
            CorrelationId: correlationId);
    }

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
            visual_identity = new
            {
                logo_url = brandStudio.VisualLogoUrl ?? string.Empty,
                primary_colors = brandStudio.VisualPrimaryColors,
                secondary_colors = brandStudio.VisualSecondaryColors,
                font_families = brandStudio.VisualFontFamilies,
                visual_style = brandStudio.VisualStyle ?? string.Empty,
                image_urls = brandStudio.VisualImageUrls
            }
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
