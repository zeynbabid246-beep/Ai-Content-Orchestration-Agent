using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Application.Features.Teams.Dtos;
using AiContentFlow.Domain.Models;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Teams;

public class TeamServiceTests
{
    [Fact]
    public async Task SetTeamNameAsync_WhenMemberIsNotAdmin_ThrowsUnauthorizedAccessException()
    {
        var teamRepo = new Mock<ITeamRepository>();
        var emailService = new Mock<IEmailService>();
        var service = new TeamService(teamRepo.Object, emailService.Object);

        var teamId = Guid.NewGuid();
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

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.SetTeamNameAsync(teamId, "viewer-1", new SetTeamNameDto("Growth Team")));
    }

    [Fact]
    public async Task SetTeamNameAsync_WhenValid_UpdatesNameAndClearsSetupFlag()
    {
        var teamRepo = new Mock<ITeamRepository>();
        var emailService = new Mock<IEmailService>();
        var service = new TeamService(teamRepo.Object, emailService.Object);

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
}
