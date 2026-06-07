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

public class AiContentServiceGeneratePostTests
{
    [Fact]
    public async Task GeneratePostAsync_LocalBackend_AppendsContentOptionHintsToPrompt()
    {
        var teamId = Guid.NewGuid();
        const string userId = "editor-1";
        string? capturedPrompt = null;

        var teamRepo = new Mock<ITeamRepository>();
        var brandRepo = new Mock<IBrandStudioRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var localAi = new Mock<ILocalAiBackendClient>();
        var campaignService = new Mock<ICampaignService>();
        var textGen = new Mock<ITextGenerationService>();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["AI:ProviderMode"] = "LocalBackend" })
            .Build();
        var logger = new Mock<ILogger<AiContentService>>();

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, userId))
            .ReturnsAsync(new UserTeam
            {
                TeamId = teamId,
                UserId = userId,
                Role = TeamRole.Editor,
                JoinedAt = DateTime.UtcNow
            });

        brandRepo.Setup(x => x.GetByTeamAsync(teamId)).ReturnsAsync((TeamBrandStudio?)null);

        localAi.Setup(x => x.GenerateContentAsync(
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<string?>(),
                It.IsAny<LocalAiBrandContext?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string?, string, IReadOnlyList<string>, string?, LocalAiBrandContext?, string, CancellationToken>(
                (_, _, prompt, _, _, _, _, _) => capturedPrompt = prompt)
            .ReturnsAsync(JsonDocument.Parse("""
                { "content": "Hello world" }
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

        await service.GeneratePostAsync(
            teamId,
            userId,
            new GeneratePostRequestDto(
                Prompt: "Write about AI",
                Model: null,
                ChannelId: null,
                CampaignId: null,
                UseBrandContext: false,
                Platform: SocialPlatform.LinkedIn,
                Format: "post",
                IncludeHashtags: true,
                IncludeCta: false,
                IncludeEmojis: true));

        Assert.NotNull(capturedPrompt);
        Assert.Contains("Include relevant hashtags.", capturedPrompt);
        Assert.Contains("Do not include a call to action.", capturedPrompt);
        Assert.Contains("Emojis are allowed in moderation.", capturedPrompt);
    }
}
