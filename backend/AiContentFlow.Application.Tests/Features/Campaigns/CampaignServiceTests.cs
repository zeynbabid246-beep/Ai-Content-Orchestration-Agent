using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Application.Features.Campaigns.Validators;
using AiContentFlow.Domain.Campaigns.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Campaigns;

public class CampaignServiceTests
{
    [Fact]
    public async Task CreateAsync_WhenChannelIsOutsideTeam_ThrowsKeyNotFoundException()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team" });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor });
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync((Channel?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(teamId, "editor-1", new CreateCampaignDto("Launch", "Desc", 7, CampaignStatus.Draft)));
    }

    [Fact]
    public async Task LinkContentPostAsync_WhenContentPostBelongsToTeam_SetsCampaignId()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        var post = new ContentPost
        {
            Id = 50,
            TeamId = teamId,
            ChannelId = 7,
            ContentJson = "{\"text\":\"hello\"}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Approved,
            CreatedByUserId = "editor-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor });
        campaignRepo.Setup(x => x.GetByIdAsync(teamId, 2)).ReturnsAsync(new Campaign
        {
            Id = 2,
            TeamId = teamId,
            ChannelId = 7,
            Name = "Launch",
            Status = CampaignStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 50)).ReturnsAsync(post);

        await service.LinkContentPostAsync(teamId, 2, "editor-1", 50);

        Assert.Equal(2, post.CampaignId);
        contentPostRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task LinkContentPostAsync_WhenChannelMismatch_ThrowsInvalidOperationException()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor });
        campaignRepo.Setup(x => x.GetByIdAsync(teamId, 2)).ReturnsAsync(new Campaign
        {
            Id = 2,
            TeamId = teamId,
            ChannelId = 7,
            Name = "Launch",
            Status = CampaignStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 50)).ReturnsAsync(new ContentPost
        {
            Id = 50,
            TeamId = teamId,
            ChannelId = 99,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Draft,
            CreatedByUserId = "editor-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.LinkContentPostAsync(teamId, 2, "editor-1", 50));
    }

    private static CampaignService CreateService(
        Mock<ICampaignRepository> campaignRepo,
        Mock<IContentPostRepository> contentPostRepo,
        Mock<ITeamRepository> teamRepo,
        Mock<IChannelRepository> channelRepo)
    {
        var brandStudioRepo = new Mock<IBrandStudioRepository>();
        var publicationService = new Mock<AiContentFlow.Application.Features.Publications.IPublicationService>();
        var activityService = new Mock<ITeamActivityService>();
        activityService.Setup(x => x.LogAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        return new CampaignService(
            campaignRepo.Object,
            contentPostRepo.Object,
            teamRepo.Object,
            channelRepo.Object,
            brandStudioRepo.Object,
            publicationService.Object,
            activityService.Object,
            new CreateCampaignDtoValidator(),
            new UpdateCampaignDtoValidator());
    }
}
