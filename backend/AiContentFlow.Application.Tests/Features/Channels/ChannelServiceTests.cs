using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Channels;
using AiContentFlow.Application.Features.Channels.Dtos;
using AiContentFlow.Application.Features.Channels.Validators;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Channels;

public class ChannelServiceTests
{
    [Fact]
    public async Task GetByTeamAsync_WhenUserIsNotMember_ThrowsUnauthorizedAccessException()
    {
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.IsUserMemberAsync(teamId, "user-1")).ReturnsAsync(false);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.GetByTeamAsync(teamId, "user-1"));
    }

    [Fact]
    public async Task CreateAsync_WhenRequesterRoleIsViewer_ThrowsUnauthorizedAccessException()
    {
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "user-1", Role = TeamRole.Viewer, JoinedAt = DateTime.UtcNow });

        var dto = new CreateChannelDto("Channel A", "Description", null, null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    [Fact]
    public async Task CreateAsync_WhenRequesterRoleIsEditor_CreatesChannel()
    {
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "editor-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "editor-1", Role = TeamRole.Editor, JoinedAt = DateTime.UtcNow });
        channelRepo.Setup(x => x.ExistsByNameAsync(teamId, "PRODUCT", null)).ReturnsAsync(false);

        Channel? saved = null;
        channelRepo.Setup(x => x.AddAsync(It.IsAny<Channel>())).Callback<Channel>(c => saved = c).Returns(Task.CompletedTask);
        channelRepo.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var result = await service.CreateAsync(teamId, "editor-1", new CreateChannelDto("Product", null, null, null));

        Assert.Equal("Product", result.Name);
        Assert.NotNull(saved);
    }

    [Fact]
    public async Task CreateAsync_WhenNameAlreadyExistsCaseInsensitive_ThrowsInvalidOperationException()
    {
        var channelRepo = new Mock<IChannelRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(channelRepo, teamRepo);

        var teamId = Guid.NewGuid();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "admin-1"))
            .ReturnsAsync(new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "admin-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow });
        channelRepo.Setup(x => x.ExistsByNameAsync(teamId, "PRODUCT AND GROWTH", null)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(teamId, "admin-1", new CreateChannelDto("product and growth", null, null, null)));
    }

    private static ChannelService CreateService(Mock<IChannelRepository> channelRepo, Mock<ITeamRepository> teamRepo)
    {
        IValidator<CreateChannelDto> createValidator = new CreateChannelDtoValidator();
        IValidator<UpdateChannelDto> updateValidator = new UpdateChannelDtoValidator();
        var brandStudioRepo = new Mock<IBrandStudioRepository>();

        return new ChannelService(channelRepo.Object, teamRepo.Object, brandStudioRepo.Object, createValidator, updateValidator);
    }
}