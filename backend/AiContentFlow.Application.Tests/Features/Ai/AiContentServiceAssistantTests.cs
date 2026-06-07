using System.Text.Json;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Ai;
using AiContentFlow.Application.Features.Ai.Dtos;
using AiContentFlow.Domain.Campaigns.Interfaces;
using AiContentFlow.Domain.Models;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Ai;

public class AiContentServiceAssistantTests
{
    [Fact]
    public async Task ChatWithAssistantAsync_ResolvesBrandIdAndRewritesScreenshotUrls()
    {
        var teamId = Guid.NewGuid();
        const string userId = "viewer-1";
        var teamRepo = new Mock<ITeamRepository>();
        var brandRepo = new Mock<IBrandStudioRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var localAi = new Mock<ILocalAiBackendClient>();
        var campaignService = new Mock<ICampaignService>();
        var textGen = new Mock<ITextGenerationService>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AI:ProviderMode"] = "LocalBackend",
                ["LocalAI:BaseUrl"] = "http://ai.example:8000",
            })
            .Build();
        var logger = new Mock<ILogger<AiContentService>>();

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, userId))
            .ReturnsAsync(new UserTeam { TeamId = teamId, UserId = userId, Role = TeamRole.Viewer });

        brandRepo.Setup(x => x.GetByTeamAsync(teamId)).ReturnsAsync(new TeamBrandStudio
        {
            TeamId = teamId,
            OrgId = "consultim_brand",
            BrandName = "Consultim",
        });

        localAi.Setup(x => x.AssistantChatAsync(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(JsonDocument.Parse("""
                {
                  "answer": "Bonjour!",
                  "intent": "platform_onboarding",
                  "brand_id": "consultim_brand",
                  "target_agent": null,
                  "needs_brand_selection": false,
                  "suggested_actions": ["Expliquer Brand DNA"],
                  "language": "fr",
                  "screenshots": [
                    {
                      "title": "Scheduler Agent",
                      "url": "http://127.0.0.1:8000/static/assistant_screenshots/schedule.png",
                      "description": "Planification des posts."
                    }
                  ],
                  "metadata": { "platform": "assistant_widget" }
                }
                """).RootElement.Clone());

        var service = new AiContentService(
            teamRepo.Object,
            brandRepo.Object,
            channelRepo.Object,
            localAi.Object,
            campaignService.Object,
            textGen.Object,
            config,
            logger.Object);

        var result = await service.ChatWithAssistantAsync(
            teamId,
            userId,
            new AssistantChatRequestDto(
                Message: "Comment utiliser la plateforme ?",
                Language: "fr",
                Context: new Dictionary<string, JsonElement>
                {
                    ["page"] = JsonDocument.Parse("\"scheduler\"").RootElement.Clone(),
                    ["campaign_id"] = JsonDocument.Parse("21").RootElement.Clone(),
                }));

        Assert.Equal("Bonjour!", result.Answer);
        Assert.Equal("consultim_brand", result.BrandId);
        Assert.Single(result.SuggestedActions);
        Assert.Single(result.Screenshots);
        Assert.Equal(
            "http://ai.example:8000/static/assistant_screenshots/schedule.png",
            result.Screenshots[0].Url);

        localAi.Verify(
            x => x.AssistantChatAsync(
                It.Is<object>(body =>
                    body.ToString()!.Contains("consultim_brand", StringComparison.Ordinal)
                    && body.ToString()!.Contains("assistant_widget", StringComparison.Ordinal)),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ChatWithAssistantAsync_ExternalProviders_Throws()
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

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "viewer-1"))
            .ReturnsAsync(new UserTeam { TeamId = teamId, UserId = "viewer-1", Role = TeamRole.Viewer });

        var service = new AiContentService(
            teamRepo.Object,
            brandRepo.Object,
            channelRepo.Object,
            localAi.Object,
            campaignService.Object,
            textGen.Object,
            config,
            logger.Object);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ChatWithAssistantAsync(
                teamId,
                "viewer-1",
                new AssistantChatRequestDto(Message: "Hello")));

        Assert.Contains("LocalBackend", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}
