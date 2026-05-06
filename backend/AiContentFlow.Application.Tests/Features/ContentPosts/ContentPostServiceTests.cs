using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Application.Features.Publications;
using AiContentFlow.Application.Features.Publications.Dtos;
using AiContentFlow.Domain.Models;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.ContentPosts;

public class ContentPostServiceTests
{
    [Fact]
    public async Task CreateAsync_WhenChannelIsNotInTeam_ThrowsKeyNotFoundException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var postVariantRepo = new Mock<IPostVariantRepository>();
        var publicationService = new Mock<IPublicationService>();
        var service = CreateService(contentPostRepo, channelRepo, teamRepo, postVariantRepo, publicationService);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team" });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin });
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync((Channel?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(teamId, "user-1", CreateDto(channelId: 7)));
    }

    [Fact]
    public async Task ScheduleAsync_WhenContentIsApproved_CreatesPublicationWithoutChangingEditorialStatus()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var postVariantRepo = new Mock<IPostVariantRepository>();
        var publicationService = new Mock<IPublicationService>();
        var service = CreateService(contentPostRepo, channelRepo, teamRepo, postVariantRepo, publicationService);

        var teamId = Guid.NewGuid();
        var scheduledAt = DateTime.UtcNow.AddHours(1);
        var post = new ContentPost
        {
            Id = 10,
            TeamId = teamId,
            ChannelId = 7,
            ContentJson = "{\"text\":\"hello\"}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Approved,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team" });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Editor });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 10)).ReturnsAsync(post);
        publicationService.Setup(x => x.ScheduleAsync(teamId, 10, "user-1", It.IsAny<SchedulePublicationDto>()))
            .ReturnsAsync(new PublicationResponseDto(1, teamId, 10, null, 22, PublicationStatus.Scheduled, scheduledAt, null, null, null, null, "schedule-1", 0, DateTime.UtcNow, DateTime.UtcNow));

        var result = await service.ScheduleAsync(teamId, 10, "user-1", new ScheduleContentPostDto(22, null, scheduledAt, "schedule-1"));

        Assert.Equal(ContentStatus.Approved, post.Status);
        Assert.Equal(ContentStatus.Approved, result.Status);
        contentPostRepo.Verify(x => x.SaveChangesAsync(), Times.Never);
        publicationService.Verify(x => x.ScheduleAsync(teamId, 10, "user-1", It.Is<SchedulePublicationDto>(dto =>
            dto.SocialAccountId == 22 && dto.ScheduledAt == scheduledAt && dto.IdempotencyKey == "schedule-1")), Times.Once);
    }

    [Fact]
    public async Task TransitionStatusAsync_WhenTargetIsPublished_ThrowsInvalidOperationException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var postVariantRepo = new Mock<IPostVariantRepository>();
        var publicationService = new Mock<IPublicationService>();
        var service = CreateService(contentPostRepo, channelRepo, teamRepo, postVariantRepo, publicationService);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team" });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 9)).ReturnsAsync(new ContentPost
        {
            Id = 9,
            TeamId = teamId,
            ChannelId = 7,
            ContentJson = "{\"text\":\"hello\"}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Scheduled,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.TransitionStatusAsync(teamId, 9, "user-1", new TransitionContentPostStatusDto(ContentStatus.Published)));
    }

    private static ContentPostService CreateService(
        Mock<IContentPostRepository> contentPostRepo,
        Mock<IChannelRepository> channelRepo,
        Mock<ITeamRepository> teamRepo,
        Mock<IPostVariantRepository> postVariantRepo,
        Mock<IPublicationService> publicationService)
    {
        return new ContentPostService(
            contentPostRepo.Object,
            channelRepo.Object,
            teamRepo.Object,
            postVariantRepo.Object,
            publicationService.Object);
    }

    private static CreateContentPostDto CreateDto(int channelId)
    {
        return new CreateContentPostDto(
            channelId,
            null,
            "Title",
            ContentType.LinkedInPost,
            "{\"text\":\"hello\"}",
            null,
            null,
            null,
            null);
    }
}
