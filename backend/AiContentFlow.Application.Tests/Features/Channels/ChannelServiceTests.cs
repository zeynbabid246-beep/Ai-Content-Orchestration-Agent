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

        var dto = new CreateChannelDto("Channel A", "Description");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.CreateAsync(teamId, "user-1", dto));
    }

    private static ChannelService CreateService(Mock<IChannelRepository> channelRepo, Mock<ITeamRepository> teamRepo)
    {
        IValidator<CreateChannelDto> createValidator = new CreateChannelDtoValidator();
        IValidator<UpdateChannelDto> updateValidator = new UpdateChannelDtoValidator();

        return new ChannelService(channelRepo.Object, teamRepo.Object, createValidator, updateValidator);
    }
}