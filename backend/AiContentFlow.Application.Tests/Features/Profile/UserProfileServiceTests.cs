using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Profile;
using AiContentFlow.Application.Features.Profile.Dtos;
using AiContentFlow.Application.Features.Profile.Validators;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Profile;

public class UserProfileServiceTests
{
    [Fact]
    public async Task GetMyProfileAsync_WhenNotTeamMember_ThrowsUnauthorizedAccessException()
    {
        var teamId = Guid.NewGuid();
        var identity = new Mock<IIdentityService>();
        identity.Setup(x => x.GetUserProfileAsync("user-1")).ReturnsAsync(new UserProfileData(
            "user-1",
            "alice",
            "alice@example.com",
            null,
            null,
            DateTime.UtcNow));

        var teamRepo = new Mock<ITeamRepository>();
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1")).ReturnsAsync((UserTeam?)null);

        var service = CreateService(identity, teamRepo);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetMyProfileAsync("user-1", teamId));
    }

    [Fact]
    public async Task GetMyProfileAsync_WhenValid_ReturnsProfile()
    {
        var teamId = Guid.NewGuid();
        var memberSince = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);

        var identity = new Mock<IIdentityService>();
        identity.Setup(x => x.GetUserProfileAsync("user-1")).ReturnsAsync(new UserProfileData(
            "user-1",
            "alice",
            "alice@example.com",
            "Designer",
            "https://example.com/avatar.png",
            memberSince));

        var teamRepo = new Mock<ITeamRepository>();
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1")).ReturnsAsync(new UserTeam
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            UserId = "user-1",
            Role = TeamRole.Admin,
            JoinedAt = DateTime.UtcNow
        });
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team
        {
            Id = teamId,
            Name = "Product Team",
            IsNameSetupRequired = false,
            CreatedAt = DateTime.UtcNow
        });

        var service = CreateService(identity, teamRepo);
        var result = await service.GetMyProfileAsync("user-1", teamId);

        Assert.Equal("alice", result.Username);
        Assert.Equal("alice@example.com", result.Email);
        Assert.Equal("Designer", result.Bio);
        Assert.Equal("Admin", result.TeamRole);
        Assert.Equal("Product Team", result.TeamName);
        Assert.Equal(memberSince, result.MemberSince);
    }

    [Fact]
    public async Task UpdateMyProfileAsync_WhenUsernameTaken_ThrowsInvalidOperationException()
    {
        var teamId = Guid.NewGuid();
        var identity = new Mock<IIdentityService>();
        identity.Setup(x => x.UpdateUsernameAsync("user-1", "bob"))
            .ReturnsAsync((false, new[] { "Username is already taken." }));

        var service = CreateService(identity, new Mock<ITeamRepository>());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateMyProfileAsync("user-1", teamId, new UpdateUserProfileDto("bob", "Bio")));
    }

    [Fact]
    public async Task UpdateMyProfileAsync_WhenValid_UpdatesProfileFields()
    {
        var teamId = Guid.NewGuid();
        var identity = new Mock<IIdentityService>();
        identity.Setup(x => x.UpdateUsernameAsync("user-1", "alice"))
            .ReturnsAsync((true, Array.Empty<string>()));
        identity.Setup(x => x.UpdateBioAsync("user-1", "Updated bio")).Returns(Task.CompletedTask);
        identity.Setup(x => x.GetUserProfileAsync("user-1")).ReturnsAsync(new UserProfileData(
            "user-1",
            "alice",
            "alice@example.com",
            "Updated bio",
            null,
            DateTime.UtcNow));

        var teamRepo = new Mock<ITeamRepository>();
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, "user-1")).ReturnsAsync(new UserTeam
        {
            Id = Guid.NewGuid(),
            TeamId = teamId,
            UserId = "user-1",
            Role = TeamRole.Editor,
            JoinedAt = DateTime.UtcNow
        });
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId)).ReturnsAsync(new Team
        {
            Id = teamId,
            Name = "Growth Team",
            IsNameSetupRequired = false,
            CreatedAt = DateTime.UtcNow
        });

        var service = CreateService(identity, teamRepo);
        var result = await service.UpdateMyProfileAsync(
            "user-1",
            teamId,
            new UpdateUserProfileDto("alice", "Updated bio"));

        identity.Verify(x => x.UpdateBioAsync("user-1", "Updated bio"), Times.Once);
        Assert.Equal("Updated bio", result.Bio);
        Assert.Equal("Editor", result.TeamRole);
    }

    private static UserProfileService CreateService(
        Mock<IIdentityService> identity,
        Mock<ITeamRepository> teamRepo)
    {
        IValidator<UpdateUserProfileDto> validator = new UpdateUserProfileDtoValidator();
        return new UserProfileService(identity.Object, teamRepo.Object, validator);
    }
}
