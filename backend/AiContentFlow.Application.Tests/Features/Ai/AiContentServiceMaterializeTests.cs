using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Ai;
using AiContentFlow.Application.Features.Ai.Dtos;
using AiContentFlow.Domain.Campaigns.Dtos;
using AiContentFlow.Domain.Campaigns.Interfaces;
using AiContentFlow.Domain.Models;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Ai;

public class AiContentServiceMaterializeTests
{
    private static (AiContentService Service, Mock<ILocalAiBackendClient> LocalAi, Mock<ICampaignService> CampaignSvc) BuildService(
        Guid teamId,
        string userId = "editor-1",
        string providerMode = "LocalBackend")
    {
        var teamRepo = new Mock<ITeamRepository>();
        var brandRepo = new Mock<IBrandStudioRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var localAi = new Mock<ILocalAiBackendClient>();
        var campaignService = new Mock<ICampaignService>();
        var textGen = new Mock<ITextGenerationService>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AI:ProviderMode"] = providerMode })
            .Build();
        var logger = new Mock<ILogger<AiContentService>>();

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, userId))
            .ReturnsAsync(new UserTeam { TeamId = teamId, UserId = userId, Role = TeamRole.Editor });

        var brand = new TeamBrandStudio
        {
            TeamId = teamId,
            OrgId = "org_test",
            BrandName = "TestBrand",
            WebsiteUrl = "https://test.com",
            BrandSummary = "Summary",
            VisualLogoUrl = "https://test.com/logo.png",
            VisualPrimaryColors = ["#000"],
            VisualSecondaryColors = ["#FFF"],
            VisualFontFamilies = ["Inter"],
            VisualStyle = "Modern",
            VisualImageUrls = [],
        };
        brandRepo.Setup(x => x.GetByTeamAsync(teamId)).ReturnsAsync(brand);
        channelRepo.Setup(x => x.GetByIdAsync(teamId, It.IsAny<int>()))
            .ReturnsAsync(new Channel { Id = 7, TeamId = teamId, Name = "Main" });

        var service = new AiContentService(
            teamRepo.Object,
            brandRepo.Object,
            channelRepo.Object,
            localAi.Object,
            campaignService.Object,
            textGen.Object,
            config,
            logger.Object);

        return (service, localAi, campaignService);
    }

    [Fact]
    public async Task MaterializeCampaignAsync_WithProvidedPosts_CreatesCampaignAndBulkPosts()
    {
        var teamId = Guid.NewGuid();
        var teamRepo = new Mock<ITeamRepository>();
        var brandRepo = new Mock<IBrandStudioRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var localAi = new Mock<ILocalAiBackendClient>();
        var campaignService = new Mock<ICampaignService>();
        var textGen = new Mock<ITextGenerationService>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AI:ProviderMode"] = "ExternalProviders" })
            .Build();
        var logger = new Mock<ILogger<AiContentService>>();

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor });

        campaignService.Setup(x => x.CreateAsync(teamId, "editor-1", It.IsAny<CreateCampaignDto>()))
            .ReturnsAsync(new CampaignResponseDto(
                10, teamId, 7, "AI Launch", "Desc", null, null, null,
                CampaignStatus.Active, new CampaignPostSummaryDto(0, 0, 0),
                DateTime.UtcNow, DateTime.UtcNow, []));

        campaignService.Setup(x => x.BulkCreatePostsAsync(teamId, 10, "editor-1", It.IsAny<BulkCreateCampaignPostsDto>()))
            .ReturnsAsync(new BulkCreateCampaignPostsResponseDto(2, [101, 102]));

        var service = new AiContentService(
            teamRepo.Object,
            brandRepo.Object,
            channelRepo.Object,
            localAi.Object,
            campaignService.Object,
            textGen.Object,
            config,
            logger.Object);

        var result = await service.MaterializeCampaignAsync(
            teamId,
            "editor-1",
            new MaterializeCampaignRequestDto(
                ChannelId: 7,
                Goal: "Product launch",
                StartDate: DateTime.UtcNow,
                EndDate: DateTime.UtcNow.AddDays(14),
                Platforms: [SocialPlatform.LinkedIn],
                RunSuggest: false,
                CampaignName: "Launch Q3",
                Description: "Brief",
                Posts:
                [
                    new MaterializeCampaignPostInputDto(
                        "Post 1",
                        "{\"text\":\"hello\"}",
                        ContentType.LinkedInPost,
                        DateTime.UtcNow.AddDays(1),
                        SocialPlatform.LinkedIn)
                ]));

        Assert.Equal(10, result.CampaignId);
        Assert.Equal(2, result.ContentPostIds.Count);
        campaignService.Verify(x => x.CreateAsync(teamId, "editor-1", It.IsAny<CreateCampaignDto>()), Times.Once);
        campaignService.Verify(x => x.BulkCreatePostsAsync(teamId, 10, "editor-1", It.IsAny<BulkCreateCampaignPostsDto>()), Times.Once);
    }

    [Fact]
    public async Task PlanningStep_PassesSelectedContentDirection()
    {
        var teamId = Guid.NewGuid();
        var (service, localAi, _) = BuildService(teamId);

        var strategyJson = JsonSerializer.SerializeToElement(new
        {
            strategy_id = 42,
            content_direction = new[] { "Thought Leadership", "Product Tips" }
        });

        var planningResponse = JsonSerializer.SerializeToElement(new { planning_id = 99, weeks = Array.Empty<object>() });
        localAi
            .Setup(x => x.GeneratePlanningAsync(
                It.IsAny<JsonElement>(), 42, 4, It.IsAny<IReadOnlyList<string>>(), "English",
                It.IsAny<string>(), "Thought Leadership", "single", It.IsAny<CancellationToken>()))
            .ReturnsAsync(planningResponse);

        var result = await service.GenerateCampaignPlanningStepAsync(
            teamId, "editor-1",
            new CampaignPlanningStepRequestDto(
                new CampaignAiPipelineConfigDto(7, "Awareness", DateTime.UtcNow, DateTime.UtcNow.AddDays(28),
                    [SocialPlatform.LinkedIn], "Tech"),
                42,
                strategyJson,
                SelectedContentDirection: "Thought Leadership",
                DirectionMode: "single"));

        Assert.Equal(99, result.PlanningId);
        localAi.Verify(x => x.GeneratePlanningAsync(
            It.IsAny<JsonElement>(), 42, 4, It.IsAny<IReadOnlyList<string>>(), "English",
            It.IsAny<string>(), "Thought Leadership", "single", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ContentStep_PassesPlatformsArrayAndVisualIdentityInBrandContext()
    {
        var teamId = Guid.NewGuid();
        var (service, localAi, _) = BuildService(teamId);

        var strategyJson = JsonSerializer.SerializeToElement(new { strategy_id = 42 });
        var planningJson = JsonSerializer.SerializeToElement(new { planning_id = 99 });

        var contentResponse = JsonSerializer.SerializeToElement(new
        {
            campaign_id = 1,
            weeks = Array.Empty<object>()
        });

        localAi
            .Setup(x => x.GenerateCampaignContentAsync(
                It.IsAny<JsonElement>(), It.IsAny<JsonElement>(), 99, "org_test",
                It.Is<IReadOnlyList<string>>(p => p.Count == 1 && p[0] == "LinkedIn"),
                "LinkedIn",
                It.Is<object>(bc => bc != null),
                "English",
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(contentResponse);

        var result = await service.GenerateCampaignContentStepAsync(
            teamId, "editor-1",
            new CampaignContentStepRequestDto(
                new CampaignAiPipelineConfigDto(7, "Sales", DateTime.UtcNow, DateTime.UtcNow.AddDays(28),
                    [SocialPlatform.LinkedIn], "Product", PrimaryPlatform: "LinkedIn"),
                42, strategyJson,
                99, planningJson));

        localAi.Verify(x => x.GenerateCampaignContentAsync(
            It.IsAny<JsonElement>(), It.IsAny<JsonElement>(), 99, "org_test",
            It.Is<IReadOnlyList<string>>(p => p.Count == 1),
            "LinkedIn",
            It.Is<object>(bc => bc != null),
            "English",
            It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
