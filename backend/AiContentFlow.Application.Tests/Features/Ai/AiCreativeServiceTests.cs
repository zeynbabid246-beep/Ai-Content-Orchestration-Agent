using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Ai;
using AiContentFlow.Application.Features.Ai.Dtos;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Ai;

public class AiCreativeServiceTests
{
    private static (AiCreativeService Service, Mock<ILocalAiBackendClient> LocalAi, Mock<IContentPostService> Posts, Mock<IAiCreativeAssetImporter> Importer) BuildService(
        Guid teamId,
        string userId = "editor-1",
        string providerMode = "LocalBackend")
    {
        var teamRepo = new Mock<ITeamRepository>();
        var brandRepo = new Mock<IBrandStudioRepository>();
        var posts = new Mock<IContentPostService>();
        var localAi = new Mock<ILocalAiBackendClient>();
        var importer = new Mock<IAiCreativeAssetImporter>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AI:ProviderMode"] = providerMode })
            .Build();
        var logger = new Mock<ILogger<AiCreativeService>>();

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, userId))
            .ReturnsAsync(new UserTeam { TeamId = teamId, UserId = userId, Role = TeamRole.Editor });

        brandRepo.Setup(x => x.GetByTeamAsync(teamId)).ReturnsAsync(new TeamBrandStudio
        {
            TeamId = teamId,
            OrgId = "org_test",
            BrandName = "TestBrand",
            VisualPrimaryColors = ["#111111"],
            VisualSecondaryColors = ["#EEEEEE"],
            VisualFontFamilies = ["Inter"],
        });

        var service = new AiCreativeService(
            teamRepo.Object,
            brandRepo.Object,
            posts.Object,
            localAi.Object,
            importer.Object,
            config,
            logger.Object);

        return (service, localAi, posts, importer);
    }

    [Fact]
    public async Task GenerateForPostAsync_ExternalProviders_Throws()
    {
        var teamId = Guid.NewGuid();
        var (service, _, _, _) = BuildService(teamId, providerMode: "ExternalProviders");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GenerateForPostAsync(
                teamId,
                "editor-1",
                new GeneratePostCreativeRequestDto(ContentPostId: 42)));
    }

    [Fact]
    public async Task GenerateForPostAsync_Poster_MergesAssetsAndUpdatesPost()
    {
        var teamId = Guid.NewGuid();
        var (service, localAi, posts, importer) = BuildService(teamId);

        var contentJson = """
            {
              "source": "ai_campaign",
              "preview": "Cloud migration basics",
              "generated": {
                "title": "Cloud migration basics",
                "intro": "Start simple."
              }
            }
            """;

        posts.Setup(x => x.GetByIdAsync(teamId, 42, "editor-1"))
            .ReturnsAsync(new ContentPostResponseDto(
                42,
                teamId,
                7,
                10,
                "Cloud migration basics",
                ContentType.LinkedInPost,
                contentJson,
                ContentStatus.Draft,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                DateTime.UtcNow,
                DateTime.UtcNow,
                []));

        localAi.Setup(x => x.GeneratePosterAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(JsonDocument.Parse("""
                {
                  "status": "success",
                  "message": "Poster generated successfully.",
                  "poster_url": "/static/generated_creatives/poster_test.png",
                  "creative_asset_url": "/static/generated_creatives/poster_test.png"
                }
                """).RootElement.Clone());

        importer.Setup(x => x.ImportFromUrlAsync(teamId, "/static/generated_creatives/poster_test.png", It.IsAny<CancellationToken>()))
            .ReturnsAsync("http://localhost:5073/uploads/team/poster.png");

        UpdateContentPostDto? capturedUpdate = null;
        posts.Setup(x => x.UpdateAsync(teamId, 42, "editor-1", It.IsAny<UpdateContentPostDto>()))
            .Callback<Guid, int, string, UpdateContentPostDto>((_, _, _, dto) => capturedUpdate = dto)
            .ReturnsAsync(new ContentPostResponseDto(
                42,
                teamId,
                7,
                10,
                "Cloud migration basics",
                ContentType.LinkedInPost,
                contentJson,
                ContentStatus.Draft,
                null,
                null,
                null,
                "http://localhost:5073/uploads/team/poster.png",
                null,
                null,
                null,
                DateTime.UtcNow,
                DateTime.UtcNow,
                []));

        var result = await service.GenerateForPostAsync(
            teamId,
            "editor-1",
            new GeneratePostCreativeRequestDto(ContentPostId: 42));

        Assert.Equal("poster", result.CreativeMode);
        Assert.Equal("http://localhost:5073/uploads/team/poster.png", result.PosterUrl);
        Assert.Contains("poster_url", result.ContentJson, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("http://localhost:5073/uploads/team/poster.png", result.ContentJson, StringComparison.Ordinal);

        localAi.Verify(x => x.GeneratePosterAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        localAi.Verify(x => x.GenerateCarouselAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.NotNull(capturedUpdate);
        Assert.Contains("poster_url", capturedUpdate!.ContentJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerateForPostAsync_Carousel_UsesCarouselEndpoint()
    {
        var teamId = Guid.NewGuid();
        var (service, localAi, posts, importer) = BuildService(teamId);

        var contentJson = """
            {
              "source": "ai_campaign",
              "preview": "Carousel topic",
              "generated": {
                "topic": "Carousel topic",
                "slides": [
                  { "title": "Slide 1", "text": "One" },
                  { "title": "Slide 2", "text": "Two" }
                ]
              }
            }
            """;

        posts.Setup(x => x.GetByIdAsync(teamId, 55, "editor-1"))
            .ReturnsAsync(new ContentPostResponseDto(
                55,
                teamId,
                7,
                null,
                "Carousel topic",
                ContentType.LinkedInPost,
                contentJson,
                ContentStatus.Draft,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                DateTime.UtcNow,
                DateTime.UtcNow,
                []));

        localAi.Setup(x => x.GenerateCarouselAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(JsonDocument.Parse("""
                {
                  "status": "success",
                  "message": "2 carousel slide asset(s) generated.",
                  "carousel_assets": [
                    "/static/generated_creatives/slide-1.png",
                    "/static/generated_creatives/slide-2.png"
                  ],
                  "poster_url": "/static/generated_creatives/slide-1.png"
                }
                """).RootElement.Clone());

        importer.Setup(x => x.ImportManyAsync(teamId, It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string>
            {
                "http://localhost:5073/uploads/team/slide-1.png",
                "http://localhost:5073/uploads/team/slide-2.png",
            });

        importer.Setup(x => x.ImportFromUrlAsync(teamId, "/static/generated_creatives/slide-1.png", It.IsAny<CancellationToken>()))
            .ReturnsAsync("http://localhost:5073/uploads/team/slide-1.png");

        posts.Setup(x => x.UpdateAsync(teamId, 55, "editor-1", It.IsAny<UpdateContentPostDto>()))
            .ReturnsAsync(new ContentPostResponseDto(
                55,
                teamId,
                7,
                null,
                "Carousel topic",
                ContentType.LinkedInPost,
                contentJson,
                ContentStatus.Draft,
                null,
                null,
                null,
                "http://localhost:5073/uploads/team/slide-1.png",
                null,
                null,
                null,
                DateTime.UtcNow,
                DateTime.UtcNow,
                []));

        var result = await service.GenerateForPostAsync(
            teamId,
            "editor-1",
            new GeneratePostCreativeRequestDto(ContentPostId: 55));

        Assert.Equal("carousel", result.CreativeMode);
        Assert.Equal(2, result.CarouselAssets.Count);
        localAi.Verify(x => x.GenerateCarouselAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GeneratePreviewAsync_Poster_RoutesToPosterEndpoint()
    {
        var teamId = Guid.NewGuid();
        var (service, localAi, _, importer) = BuildService(teamId);

        var contentJson = """
            {
              "source": "quick_generate",
              "preview": "Launch teaser",
              "generated": {
                "content_type": "Static Image",
                "hook": "Launch teaser",
                "body": "Big news coming.",
                "visual_direction": "Minimal poster with product hero shot"
              }
            }
            """;

        localAi.Setup(x => x.GeneratePosterAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(JsonDocument.Parse("""
                {
                  "status": "success",
                  "poster_url": "/static/generated_creatives/poster_preview.png"
                }
                """).RootElement.Clone());

        importer.Setup(x => x.ImportFromUrlAsync(teamId, "/static/generated_creatives/poster_preview.png", It.IsAny<CancellationToken>()))
            .ReturnsAsync("http://localhost:5073/uploads/team/poster_preview.png");

        var result = await service.GeneratePreviewAsync(
            teamId,
            "editor-1",
            new GenerateCreativePreviewRequestDto(
                ContentJson: contentJson,
                Platform: SocialPlatform.LinkedIn,
                Language: "English"));

        Assert.Equal("poster", result.CreativeMode);
        Assert.Equal("http://localhost:5073/uploads/team/poster_preview.png", result.PosterUrl);
        localAi.Verify(x => x.GeneratePosterAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        localAi.Verify(x => x.GenerateCarouselAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GeneratePreviewAsync_Carousel_RoutesToCarouselEndpoint()
    {
        var teamId = Guid.NewGuid();
        var (service, localAi, _, importer) = BuildService(teamId);

        var contentJson = """
            {
              "source": "quick_generate",
              "preview": "Tips carousel",
              "generated": {
                "content_type": "Carousel",
                "hook": "Tips carousel",
                "slides": [
                  { "title": "Slide 1", "text": "One" },
                  { "title": "Slide 2", "text": "Two" }
                ]
              }
            }
            """;

        localAi.Setup(x => x.GenerateCarouselAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(JsonDocument.Parse("""
                {
                  "status": "success",
                  "carousel_assets": [
                    "/static/generated_creatives/slide-1.png",
                    "/static/generated_creatives/slide-2.png"
                  ]
                }
                """).RootElement.Clone());

        importer.Setup(x => x.ImportManyAsync(teamId, It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<string>
            {
                "http://localhost:5073/uploads/team/slide-1.png",
                "http://localhost:5073/uploads/team/slide-2.png",
            });

        var result = await service.GeneratePreviewAsync(
            teamId,
            "editor-1",
            new GenerateCreativePreviewRequestDto(
                ContentJson: contentJson,
                Platform: SocialPlatform.Instagram,
                Language: "English"));

        Assert.Equal("carousel", result.CreativeMode);
        Assert.Equal(2, result.CarouselAssets.Count);
        localAi.Verify(x => x.GenerateCarouselAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        localAi.Verify(x => x.GeneratePosterAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
