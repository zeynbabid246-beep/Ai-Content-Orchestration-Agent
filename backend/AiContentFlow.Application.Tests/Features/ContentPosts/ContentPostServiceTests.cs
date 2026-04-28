using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.ContentPosts.Dtos;
using AiContentFlow.Domain.Models;
using Application.DTOs;
using Application.Interfaces;
using Application.UseCases;
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
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync((Channel?)null);

        var dto = CreateDto(channelId: 7, socialAccountId: 11);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    [Fact]
    public async Task CreateAsync_WhenSocialAccountIsNotInTeam_ThrowsKeyNotFoundException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync(new Channel { Id = 7, TeamId = teamId, Name = "Main", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        socialRepo.Setup(x => x.GetByIdAsync(teamId, 11)).ReturnsAsync((SocialAccount?)null);

        var dto = CreateDto(channelId: 7, socialAccountId: 11);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    [Fact]
    public async Task UpdateAsync_WhenSocialAccountChannelDoesNotMatchChannel_ThrowsInvalidOperationException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        var existing = new ContentPost
        {
            Id = 100,
            TeamId = teamId,
            ChannelId = 7,
            SocialAccountId = 11,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Draft,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 100)).ReturnsAsync(existing);
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync(new Channel { Id = 7, TeamId = teamId, Name = "Main", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        socialRepo.Setup(x => x.GetByIdAsync(teamId, 11)).ReturnsAsync(new SocialAccount { Id = 11, TeamId = teamId, ChannelId = 9, AccountHandle = "@brand", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

        var dto = new UpdateContentPostDto(
            7,
            11,
            "Updated",
            ContentType.LinkedInPost,
            "{\"text\":\"updated\"}",
            ContentStatus.Ready,
            null,
            null,
            null,
            null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateAsync(teamId, 100, "user-1", dto));
    }

    [Fact]
    public async Task TransitionStatusAsync_WhenTransitionIsInvalid_ThrowsInvalidOperationException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 9)).ReturnsAsync(new ContentPost
        {
            Id = 9,
            TeamId = teamId,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Draft,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        var dto = new TransitionContentPostStatusDto(ContentStatus.Published);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.TransitionStatusAsync(teamId, 9, "user-1", dto));
    }

    [Fact]
    public async Task ScheduleAsync_WhenContentPostIsOutsideTeamScope_ThrowsKeyNotFoundException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 99)).ReturnsAsync((ContentPost?)null);

        var dto = new ScheduleContentPostDto(DateTime.UtcNow.AddMinutes(30));

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.ScheduleAsync(teamId, 99, "user-1", dto));
    }

    [Fact]
    public async Task ScheduleAsync_WhenRequesterRoleIsViewer_ThrowsUnauthorizedAccessException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "viewer"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "viewer", Role = TeamRole.Viewer, JoinedAt = DateTime.UtcNow });

        var dto = new ScheduleContentPostDto(DateTime.UtcNow.AddMinutes(30));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.ScheduleAsync(teamId, 1, "viewer", dto));
    }

    [Fact]
    public async Task ScheduleAsync_WhenRequesterRoleIsEditor_AllowsScheduling()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var postVariantRepo = new Mock<IPostVariantRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo, postVariantRepo);

        var teamId = Guid.NewGuid();
        var contentPost = new ContentPost
        {
            Id = 20,
            TeamId = teamId,
            SocialAccountId = 12,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Ready,
            CreatedByUserId = "editor-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor, JoinedAt = DateTime.UtcNow });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 20)).ReturnsAsync(contentPost);
        socialRepo.Setup(x => x.GetByIdAsync(teamId, 12)).ReturnsAsync(new SocialAccount
        {
            Id = 12,
            TeamId = teamId,
            ChannelId = 1,
            Platform = SocialPlatform.LinkedIn,
            Status = SocialAccountStatus.Active,
            IsActive = true,
            AccountHandle = "@brand",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        postVariantRepo.Setup(x => x.GetByContentPostIdAsync(20)).ReturnsAsync(new List<PostVariant>());

        var scheduledAt = DateTime.UtcNow.AddMinutes(30);

        var result = await service.ScheduleAsync(teamId, 20, "editor-1", new ScheduleContentPostDto(scheduledAt));

        Assert.Equal(ContentStatus.Scheduled, result.Status);
        Assert.Equal(scheduledAt, result.ScheduledAt);
        contentPostRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
        postVariantRepo.Verify(x => x.AddAsync(It.IsAny<PostVariant>()), Times.Once);
    }

    [Fact]
    public async Task ScheduleAndPublishAsync_WhenLifecycleIsValid_Succeeds()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var postVariantRepo = new Mock<IPostVariantRepository>();
        var publisher = new Mock<IPublisher>();
        publisher.SetupGet(p => p.Platform).Returns(SocialPlatform.LinkedIn);
        publisher.Setup(p => p.PublishAsync(It.IsAny<PostVariant>(), It.IsAny<SocialAccount>()))
            .ReturnsAsync(PublishResult.Success("li-123", "https://linkedin.example/123"));
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo, postVariantRepo, publisher);

        var teamId = Guid.NewGuid();
        var contentPost = new ContentPost
        {
            Id = 10,
            TeamId = teamId,
            SocialAccountId = 44,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Ready,
            CreatedByUserId = "owner-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "owner-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "owner-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 10)).ReturnsAsync(contentPost);
        socialRepo.Setup(x => x.GetByIdAsync(teamId, 44)).ReturnsAsync(new SocialAccount
        {
            Id = 44,
            TeamId = teamId,
            ChannelId = 1,
            Platform = SocialPlatform.LinkedIn,
            Status = SocialAccountStatus.Active,
            IsActive = true,
            AccountHandle = "@brand",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        postVariantRepo.Setup(x => x.GetByContentPostIdAsync(10)).ReturnsAsync(new List<PostVariant>());

        var scheduledAt = DateTime.UtcNow.AddHours(2);
        var scheduled = await service.ScheduleAsync(teamId, 10, "owner-1", new ScheduleContentPostDto(scheduledAt));

        Assert.Equal(ContentStatus.Scheduled, scheduled.Status);
        Assert.Equal(scheduledAt, scheduled.ScheduledAt);

        var published = await service.PublishAsync(teamId, 10, "owner-1", new PublishContentPostDto("platform-123", "https://social.example/post/123"));

        Assert.Equal(ContentStatus.Published, published.Status);
        Assert.NotNull(published.PublishedAt);
        Assert.Equal("li-123", published.PlatformPostId);
        Assert.Equal("https://linkedin.example/123", published.PlatformPostUrl);

        contentPostRepo.Verify(x => x.SaveChangesAsync(), Times.Exactly(2));
    }

    [Fact]
    public async Task UpdateAsync_WhenStatusIsScheduled_ThrowsInvalidOperationException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        var existing = new ContentPost
        {
            Id = 101,
            TeamId = teamId,
            ChannelId = 7,
            SocialAccountId = 11,
            ContentJson = "{}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Ready,
            CreatedByUserId = "owner-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "owner-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "owner-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, 101)).ReturnsAsync(existing);
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync(new Channel { Id = 7, TeamId = teamId, Name = "Main", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        socialRepo.Setup(x => x.GetByIdAsync(teamId, 11)).ReturnsAsync(new SocialAccount { Id = 11, TeamId = teamId, ChannelId = 7, AccountHandle = "@brand", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

        var dto = new UpdateContentPostDto(
            7,
            11,
            "Updated",
            ContentType.LinkedInPost,
            "{\"text\":\"updated\"}",
            ContentStatus.Scheduled,
            null,
            null,
            null,
            null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UpdateAsync(teamId, 101, "owner-1", dto));
    }

    [Fact]
    public async Task CreateAsync_WhenLinkageIsValid_CreatesContentPost()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 7)).ReturnsAsync(new Channel { Id = 7, TeamId = teamId, Name = "Main", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        socialRepo.Setup(x => x.GetByIdAsync(teamId, 11)).ReturnsAsync(new SocialAccount { Id = 11, TeamId = teamId, ChannelId = 7, AccountHandle = "@brand", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

        ContentPost? captured = null;
        contentPostRepo
            .Setup(x => x.AddAsync(It.IsAny<ContentPost>()))
            .Callback<ContentPost>(cp => captured = cp)
            .Returns(Task.CompletedTask);

        var dto = CreateDto(channelId: 7, socialAccountId: 11);

        var result = await service.CreateAsync(teamId, "user-1", dto);

        Assert.NotNull(captured);
        Assert.Equal(7, captured!.ChannelId);
        Assert.Equal(11, captured.SocialAccountId);
        Assert.Equal(teamId, captured.TeamId);
        Assert.Equal(7, result.ChannelId);
        Assert.Equal(11, result.SocialAccountId);

        contentPostRepo.Verify(x => x.AddAsync(It.IsAny<ContentPost>()), Times.Once);
        contentPostRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenChannelAndSocialAreMissing_CreatesStandaloneContentPost()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        ContentPost? captured = null;
        contentPostRepo
            .Setup(x => x.AddAsync(It.IsAny<ContentPost>()))
            .Callback<ContentPost>(cp => captured = cp)
            .Returns(Task.CompletedTask);

        var dto = CreateDto(channelId: null, socialAccountId: null);

        var result = await service.CreateAsync(teamId, "user-1", dto);

        Assert.NotNull(captured);
        Assert.Null(captured.SocialAccountId);
        Assert.Null(result.ChannelId);
        Assert.Null(result.SocialAccountId);

        channelRepo.Verify(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
        socialRepo.Verify(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WhenSocialAccountProvidedWithoutChannel_ThrowsInvalidOperationException()
    {
        var contentPostRepo = new Mock<IContentPostRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var socialRepo = new Mock<ISocialAccountRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(contentPostRepo, channelRepo, socialRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        var dto = CreateDto(channelId: null, socialAccountId: 11);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    private static ContentPostService CreateService(
        Mock<IContentPostRepository> contentPostRepo,
        Mock<IChannelRepository> channelRepo,
        Mock<ISocialAccountRepository> socialRepo,
        Mock<ITeamRepository> teamRepo,
        Mock<IPostVariantRepository>? postVariantRepo = null,
        Mock<IPublisher>? publisher = null)
    {
        var variantRepo = postVariantRepo ?? new Mock<IPostVariantRepository>();
        var publisherMock = publisher ?? new Mock<IPublisher>();

        publisherMock.SetupGet(p => p.Platform).Returns(SocialPlatform.LinkedIn);
        publisherMock.Setup(p => p.PublishAsync(It.IsAny<PostVariant>(), It.IsAny<SocialAccount>()))
            .ReturnsAsync(PublishResult.Success("post-1", "https://social.example/post-1"));

        var publishUseCase = new PublishPostUseCase(
            new[] { publisherMock.Object },
            socialRepo.Object,
            contentPostRepo.Object,
            variantRepo.Object);

        return new ContentPostService(
            contentPostRepo.Object,
            channelRepo.Object,
            socialRepo.Object,
            teamRepo.Object,
            variantRepo.Object,
            publishUseCase);
    }

    private static CreateContentPostDto CreateDto(int? channelId, int? socialAccountId)
    {
        return new CreateContentPostDto(
            channelId,
            socialAccountId,
            "Launch",
            ContentType.LinkedInPost,
            "{\"text\":\"hello\"}",
            "Prompt",
            "gpt-4o",
            100,
            null);
    }
}
