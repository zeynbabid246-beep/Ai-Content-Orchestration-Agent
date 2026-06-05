using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Teams;

public class TeamServiceTests
{
    [Fact]
    public async Task SetTeamNameAsync_WhenMemberIsNotAdmin_ThrowsUnauthorizedAccessException()
    {
        var teamId = Guid.NewGuid();
        var teamRepo = new Mock<ITeamRepository>();
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team
        {
            Id = teamId,
            Name = "Temp Team",
            IsNameSetupRequired = true,
            CreatedAt = DateTime.UtcNow
        });

        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "viewer-1")).ReturnsAsync(new UserTeam
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            UserId = "viewer-1",
            Role = TeamRole.Viewer,
            JoinedAt = DateTime.UtcNow
        });

        var serviceWithRepo = CreateService(teamRepo, new Mock<ITeamInvitationRepository>());

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            serviceWithRepo.SetTeamNameAsync(teamId, "viewer-1", new SetTeamNameDto("Growth Team")));
    }

    [Fact]
    public async Task SetTeamNameAsync_WhenValid_UpdatesNameAndClearsSetupFlag()
    {
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(teamRepo, new Mock<ITeamInvitationRepository>());

        var teamId = Guid.NewGuid();
        var team = new Team
        {
            Id = teamId,
            Name = "Temp Team",
            IsNameSetupRequired = true,
            CreatedAt = DateTime.UtcNow
        };

        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(team);
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "admin-1")).ReturnsAsync(new UserTeam
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            UserId = "admin-1",
            Role = TeamRole.Admin,
            JoinedAt = DateTime.UtcNow
        });

        teamRepo.Setup(x => x.GetTeamByNameAsync("Product Team")).ReturnsAsync((Team?)null);
        teamRepo.Setup(x => x.GetTeamMembersAsync(teamId)).ReturnsAsync([
            (new UserTeam { Id = Guid.NewGuid(), TeamId = teamId, UserId = "admin-1", Role = TeamRole.Admin, JoinedAt = DateTime.UtcNow }, "admin-1", "admin", "admin@example.com")
        ]);

        var result = await service.SetTeamNameAsync(teamId, "admin-1", new SetTeamNameDto("Product Team"));

        Assert.Equal("Product Team", team.Name);
        Assert.False(team.IsNameSetupRequired);
        Assert.Equal("Product Team", result.Name);
        teamRepo.Verify(x => x.SaveChangesAsync(), Times.Once);
    }

    private static TeamService CreateService(
        Mock<ITeamRepository> teamRepo,
        Mock<ITeamInvitationRepository> invitationRepo)
    {
        var activityService = new Mock<ITeamActivityService>();
        activityService.Setup(x => x.LogAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        return new TeamService(
            teamRepo.Object,
            invitationRepo.Object,
            new Mock<IEmailService>().Object,
            activityService.Object,
            Options.Create(new AppSettings { FrontendBaseUrl = "http://localhost:5173" }),
            new Mock<ILogger<TeamService>>().Object);
    }
}
