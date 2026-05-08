using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.SocialAccounts;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using AiContentFlow.Application.Features.SocialAccounts.Validators;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.SocialAccounts;

public class SocialAccountServiceTests
{
    [Fact]
    public async Task CreateAsync_WhenRequesterIsEditor_CreatesSocialAccount()
    {
        var socialRepo = new Mock<ISocialAccountRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(socialRepo, channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Editor, JoinedAt = DateTime.UtcNow });
        channelRepo.Setup(x => x.GetByIdAsync(teamId, 1))
            .ReturnsAsync(new Channel { Id = 1, TeamId = teamId, Name = "Main", NormalizedName = "main", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        socialRepo.Setup(x => x.ExistsAsync(teamId, 1, SocialPlatform.LinkedIn, "@brand", null)).ReturnsAsync(false);

        var dto = new CreateSocialAccountDto(1, SocialPlatform.LinkedIn, "@brand", "Brand", "ext-1");
        var result = await service.CreateAsync(teamId, "user-1", dto);

        Assert.Equal(SocialPlatform.LinkedIn, result.Platform);
        socialRepo.Verify(x => x.AddAsync(It.IsAny<SocialAccount>()), Times.Once);
        socialRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WhenPlatformIsInstagram_ThrowsInvalidOperationException()
    {
        var socialRepo = new Mock<ISocialAccountRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(socialRepo, channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        var dto = new CreateSocialAccountDto(1, SocialPlatform.Instagram, "@brand", "Brand", "ext-1");
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    [Fact]
    public async Task CreateAsync_WhenRequesterIsNotMember_ThrowsUnauthorizedAccessException()
    {
        var socialRepo = new Mock<ISocialAccountRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(socialRepo, channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1")).ReturnsAsync((UserTeam?)null);

        var dto = new CreateSocialAccountDto(1, SocialPlatform.LinkedIn, "@brand", "Brand", null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    [Fact]
    public async Task CreateAsync_WhenChannelNotInTeam_ThrowsKeyNotFoundException()
    {
        var socialRepo = new Mock<ISocialAccountRepository>();
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(socialRepo, channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });

        channelRepo.Setup(x => x.GetByIdAsync(teamId, 77)).ReturnsAsync((Channel?)null);

        var dto = new CreateSocialAccountDto(77, SocialPlatform.LinkedIn, "@brand", "Brand", null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    private static SocialAccountService CreateService(
        Mock<ISocialAccountRepository> socialRepo,
        Mock<IChannelRepository> channelRepo,
        Mock<ITeamRepository> teamRepo)
    {
        IValidator<CreateSocialAccountDto> createValidator = new CreateSocialAccountDtoValidator();
        IValidator<UpdateSocialAccountDto> updateValidator = new UpdateSocialAccountDtoValidator();

        return new SocialAccountService(socialRepo.Object, channelRepo.Object, teamRepo.Object, createValidator, updateValidator);
    }
}