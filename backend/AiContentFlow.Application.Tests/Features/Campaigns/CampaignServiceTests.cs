using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Domain.Campaigns.Dtos;
using AiContentFlow.Domain.Models;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Campaigns;

public class CampaignServiceTests
{
    [Fact]
    public async Task GetByIdAsync_WhenRequesterIsNotTeamMember_ThrowsUnauthorizedAccessException()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var linkRepo = new Mock<ICampaignContentPostRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, linkRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.IsUserMemberAsync(teamId, "user-1")).ReturnsAsync(false);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.GetByIdAsync(teamId, 10, "user-1"));
    }

    [Fact]
    public async Task CreateAsync_WhenRequesterRoleIsEditor_Succeeds()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var linkRepo = new Mock<ICampaignContentPostRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, linkRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor, JoinedAt = DateTime.UtcNow });

        campaignRepo.Setup(x => x.ExistsByNameAsync(teamId, "Launch", null)).ReturnsAsync(false);

        var result = await service.CreateAsync(teamId, "editor-1", new CreateCampaignDto("Launch", "Desc", null, CampaignStatus.Draft));

        Assert.Equal("Launch", result.Name);
        campaignRepo.Verify(x => x.AddAsync(It.IsAny<Campaign>()), Times.Once);
        campaignRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task LinkContentPostAsync_WhenContentPostIsNotInTeam_ThrowsKeyNotFoundException()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var linkRepo = new Mock<ICampaignContentPostRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, linkRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        campaignRepo.Setup(x => x.GetByIdAsync(teamId, 2)).ReturnsAsync(new Campaign
        {
            Id = 2,
            TeamId = teamId,
            Name = "Launch",
            Status = CampaignStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 50)).ReturnsAsync((ContentPost?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.LinkContentPostAsync(teamId, 2, "user-1", 50));
    }

    [Fact]
    public async Task LinkContentPostAsync_WhenLinkAlreadyExists_ThrowsInvalidOperationException()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var linkRepo = new Mock<ICampaignContentPostRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, linkRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        campaignRepo.Setup(x => x.GetByIdAsync(teamId, 2)).ReturnsAsync(new Campaign
        {
            Id = 2,
            TeamId = teamId,
            Name = "Launch",
            Status = CampaignStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 50)).ReturnsAsync(new ContentPost
        {
            Id = 50,
            TeamId = teamId,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Draft,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        linkRepo.Setup(x => x.GetByIdsAsync(2, 50)).ReturnsAsync(new CampaignContentPost
        {
            CampaignId = 2,
            ContentPostId = 50,
            LinkedAt = DateTime.UtcNow,
            LinkedByUserId = "user-1"
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.LinkContentPostAsync(teamId, 2, "user-1", 50));
    }

    [Fact]
    public async Task LinkAndUnlinkContentPostAsync_WhenSameTeamAndValid_Succeeds()
    {
        var campaignRepo = new Mock<ICampaignRepository>();
        var linkRepo = new Mock<ICampaignContentPostRepository>();
        var contentPostRepo = new Mock<IContentPostRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var service = CreateService(campaignRepo, linkRepo, contentPostRepo, teamRepo, channelRepo);

        var teamId = Guid.NewGuid();
        var campaign = new Campaign
        {
            Id = 2,
            TeamId = teamId,
            Name = "Launch",
            Status = CampaignStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        campaignRepo.Setup(x => x.GetByIdAsync(teamId, 2)).ReturnsAsync(campaign);
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 50)).ReturnsAsync(new ContentPost
        {
            Id = 50,
            TeamId = teamId,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Draft,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        CampaignContentPost? added = null;
        linkRepo.Setup(x => x.GetByIdsAsync(2, 50)).ReturnsAsync((CampaignContentPost?)null);
        linkRepo.Setup(x => x.AddAsync(It.IsAny<CampaignContentPost>()))
            .Callback<CampaignContentPost>(x => added = x)
            .Returns(Task.CompletedTask);

        await service.LinkContentPostAsync(teamId, 2, "user-1", 50);

        Assert.NotNull(added);
        Assert.Equal(2, added!.CampaignId);
        Assert.Equal(50, added.ContentPostId);

        linkRepo.Setup(x => x.GetByIdsAsync(2, 50)).ReturnsAsync(new CampaignContentPost
        {
            CampaignId = 2,
            ContentPostId = 50,
            LinkedAt = DateTime.UtcNow,
            LinkedByUserId = "user-1"
        });

        await service.UnlinkContentPostAsync(teamId, 2, "user-1", 50);

        linkRepo.Verify(x => x.AddAsync(It.IsAny<CampaignContentPost>()), Times.Once);
        linkRepo.Verify(x => x.RemoveAsync(It.IsAny<CampaignContentPost>()), Times.Once);
        linkRepo.Verify(x => x.SaveChangesAsync(), Times.Exactly(2));
    }

    private static CampaignService CreateService(
        Mock<ICampaignRepository> campaignRepo,
        Mock<ICampaignContentPostRepository> linkRepo,
        Mock<IContentPostRepository> contentPostRepo,
        Mock<ITeamRepository> teamRepo,
        Mock<IChannelRepository> channelRepo)
    {
        return new CampaignService(campaignRepo.Object, linkRepo.Object, contentPostRepo.Object, teamRepo.Object, channelRepo.Object);
    }
}
