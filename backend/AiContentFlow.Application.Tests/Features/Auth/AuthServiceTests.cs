using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Application.Features.Auth.Dtos;
using AiContentFlow.Domain.Models;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.Auth;

public class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_WhenTeamNameProvided_CreatesAdminTeamMembership()
    {
        var identityService = new Mock<IIdentityService>();
        var jwtGenerator = new Mock<IJwtTokenGenerator>();
        var refreshRepo = new Mock<IRefreshTokenRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var transaction = new Mock<IApplicationTransaction>();

        transaction.Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(func => func());

        identityService.Setup(x => x.RegisterAsync("user@example.com", "P@ssw0rd123", "ousse"))
            .ReturnsAsync((true, "user-1", "user@example.com", "ousse", Enumerable.Empty<string>()));

        jwtGenerator.Setup(x => x.GenerateToken("user-1", "user@example.com")).Returns("access-token");
        jwtGenerator.Setup(x => x.GenerateRefreshToken()).Returns("refresh-token");

        UserTeam? capturedMembership = null;
        Team? capturedTeam = null;

        teamRepo.Setup(x => x.AddTeamAsync(It.IsAny<Team>()))
            .Callback<Team>(team => capturedTeam = team)
            .Returns(Task.CompletedTask);

        teamRepo.Setup(x => x.AddUserTeamAsync(It.IsAny<UserTeam>()))
            .Callback<UserTeam>(membership => capturedMembership = membership)
            .Returns(Task.CompletedTask);

        var service = new AuthService(identityService.Object, jwtGenerator.Object, refreshRepo.Object, teamRepo.Object, transaction.Object);

        var result = await service.RegisterAsync(new RegisterRequestDto
        {
            Username = "ousse",
            Email = "user@example.com",
            Password = "P@ssw0rd123",
            TeamName = "Product and Growth"
        });

        Assert.NotNull(capturedTeam);
        Assert.NotNull(capturedMembership);
        Assert.Equal("Product and Growth", capturedTeam!.Name);
        Assert.False(capturedTeam.IsNameSetupRequired);
        Assert.Equal(TeamRole.Admin, capturedMembership!.Role);
        Assert.Equal(capturedTeam.Id, capturedMembership.TeamId);
        Assert.Equal(capturedTeam.Id, result.TeamId);
        Assert.Equal("Admin", result.TeamRole);
        Assert.False(result.IsTeamNameSetupRequired);

        refreshRepo.Verify(x => x.AddAsync("user-1", "refresh-token", "user@example.com", "ousse", It.IsAny<DateTime>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WhenTeamNameMissing_SetsOnboardingFlag()
    {
        var identityService = new Mock<IIdentityService>();
        var jwtGenerator = new Mock<IJwtTokenGenerator>();
        var refreshRepo = new Mock<IRefreshTokenRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var transaction = new Mock<IApplicationTransaction>();

        transaction.Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(func => func());

        identityService.Setup(x => x.RegisterAsync("user@example.com", "P@ssw0rd123", "ousse"))
            .ReturnsAsync((true, "user-1", "user@example.com", "ousse", Enumerable.Empty<string>()));

        jwtGenerator.Setup(x => x.GenerateToken("user-1", "user@example.com")).Returns("access-token");
        jwtGenerator.Setup(x => x.GenerateRefreshToken()).Returns("refresh-token");

        Team? capturedTeam = null;

        teamRepo.Setup(x => x.AddTeamAsync(It.IsAny<Team>()))
            .Callback<Team>(team => capturedTeam = team)
            .Returns(Task.CompletedTask);

        teamRepo.Setup(x => x.AddUserTeamAsync(It.IsAny<UserTeam>()))
            .Returns(Task.CompletedTask);

        var service = new AuthService(identityService.Object, jwtGenerator.Object, refreshRepo.Object, teamRepo.Object, transaction.Object);

        var result = await service.RegisterAsync(new RegisterRequestDto
        {
            Username = "ousse",
            Email = "user@example.com",
            Password = "P@ssw0rd123"
        });

        Assert.NotNull(capturedTeam);
        Assert.True(capturedTeam!.IsNameSetupRequired);
        Assert.Equal("ousse Team", capturedTeam.Name);
        Assert.True(result.IsTeamNameSetupRequired);
        Assert.Equal(capturedTeam.Id, result.TeamId);
    }
}
