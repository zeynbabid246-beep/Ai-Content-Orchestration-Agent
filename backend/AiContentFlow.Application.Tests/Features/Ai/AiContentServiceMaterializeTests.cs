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
                CampaignStatus.Draft, DateTime.UtcNow, DateTime.UtcNow, []));

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
}
