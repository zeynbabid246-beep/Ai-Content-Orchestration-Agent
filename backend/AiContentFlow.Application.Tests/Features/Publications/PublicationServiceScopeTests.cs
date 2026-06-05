using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Publications;
using AiContentFlow.Application.Features.Publications.Dtos;
using AiContentFlow.Domain.Models;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Publications;

public class PublicationServiceScopeTests
{
    [Fact]
    public async Task PublishAsync_WhenPostHasNoChannel_AllowsAnyTeamAccount()
    {
        var service = CreateService(
            out var channelLinkRepo,
            out var contentPostRepo,
            out var socialAccountRepo,
            out var teamRepo,
            out var postVariantRepo);

        var teamId = Guid.NewGuid();
        var variant = new PostVariant
        {
            Id = 5,
            ContentPostId = 1,
            Platform = SocialPlatform.LinkedIn,
            ContentJson = "{\"text\":\"hi\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var post = new ContentPost
        {
            Id = 1,
            TeamId = teamId,
            ChannelId = null,
            ContentJson = "{\"text\":\"hi\"}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Approved,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PostVariants = [variant]
        };

        var account = new SocialAccount
        {
            Id = 22,
            TeamId = teamId,
            Platform = SocialPlatform.LinkedIn,
            Status = SocialAccountStatus.Active,
            IsActive = true,
            AccountHandle = "@brand",
            ExternalAccountId = "ext",
            OAuthToken = "token",
            TokenExpiry = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        SetupPublishMocks(teamRepo, contentPostRepo, socialAccountRepo, postVariantRepo, teamId, post, account, variant);

        var result = await service.PublishAsync(teamId, 1, "user-1", new PublishPublicationDto(22, 5, "key-1"));

        Assert.Equal(PublicationStatus.Queued, result.Status);
        channelLinkRepo.Verify(
            x => x.IsLinkedAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
    }

    [Fact]
    public async Task PublishAsync_WhenPostHasChannel_RequiresLinkedAccount()
    {
        var service = CreateService(
            out var channelLinkRepo,
            out var contentPostRepo,
            out var socialAccountRepo,
            out var teamRepo,
            out var postVariantRepo);

        var teamId = Guid.NewGuid();
        var variant = new PostVariant
        {
            Id = 5,
            ContentPostId = 1,
            Platform = SocialPlatform.LinkedIn,
            ContentJson = "{\"text\":\"hi\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var post = new ContentPost
        {
            Id = 1,
            TeamId = teamId,
            ChannelId = 7,
            ContentJson = "{\"text\":\"hi\"}",
            ContentType = ContentType.LinkedInPost,
            Status = ContentStatus.Approved,
            CreatedByUserId = "user-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PostVariants = [variant]
        };

        var account = new SocialAccount
        {
            Id = 22,
            TeamId = teamId,
            Platform = SocialPlatform.LinkedIn,
            Status = SocialAccountStatus.Active,
            IsActive = true,
            AccountHandle = "@brand",
            ExternalAccountId = "ext",
            OAuthToken = "token",
            TokenExpiry = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        SetupPublishMocks(teamRepo, contentPostRepo, socialAccountRepo, postVariantRepo, teamId, post, account, variant);
        channelLinkRepo.Setup(x => x.IsLinkedAsync(teamId, 7, 22)).ReturnsAsync(false);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.PublishAsync(teamId, 1, "user-1", new PublishPublicationDto(22, 5, "key-2")));
    }

    private static void SetupPublishMocks(
        Mock<ITeamRepository> teamRepo,
        Mock<IContentPostRepository> contentPostRepo,
        Mock<ISocialAccountRepository> socialAccountRepo,
        Mock<IPostVariantRepository> postVariantRepo,
        Guid teamId,
        ContentPost post,
        SocialAccount account,
        PostVariant variant)
    {
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team" });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Editor });

        contentPostRepo.Setup(x => x.GetByIdAsync(teamId, post.Id)).ReturnsAsync(post);
        socialAccountRepo.Setup(x => x.GetByIdAsync(teamId, account.Id)).ReturnsAsync(account);
        postVariantRepo.Setup(x => x.GetByIdAsync(teamId, variant.Id)).ReturnsAsync(variant);
    }

    private static PublicationService CreateService(
        out Mock<IChannelSocialAccountRepository> channelLinkRepo,
        out Mock<IContentPostRepository> contentPostRepo,
        out Mock<ISocialAccountRepository> socialAccountRepo,
        out Mock<ITeamRepository> teamRepo,
        out Mock<IPostVariantRepository> postVariantRepo)
    {
        contentPostRepo = new Mock<IContentPostRepository>();
        socialAccountRepo = new Mock<ISocialAccountRepository>();
        channelLinkRepo = new Mock<IChannelSocialAccountRepository>();
        teamRepo = new Mock<ITeamRepository>();
        postVariantRepo = new Mock<IPostVariantRepository>();
        var publicationRepo = new Mock<IPostPublicationRepository>();
        var publishJobRepo = new Mock<IPublishJobRepository>();
        var transaction = new Mock<IApplicationTransaction>();

        publicationRepo.Setup(x => x.GetByIdempotencyKeyAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync((PostPublication?)null);
        publicationRepo.Setup(x => x.GetActiveByIntentAsync(
                It.IsAny<Guid>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int?>(),
                It.IsAny<DateTime?>()))
            .ReturnsAsync((PostPublication?)null);

        transaction.Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(async action => await action());

        return new PublicationService(
            contentPostRepo.Object,
            socialAccountRepo.Object,
            channelLinkRepo.Object,
            postVariantRepo.Object,
            publicationRepo.Object,
            publishJobRepo.Object,
            teamRepo.Object,
            transaction.Object);
    }
}
