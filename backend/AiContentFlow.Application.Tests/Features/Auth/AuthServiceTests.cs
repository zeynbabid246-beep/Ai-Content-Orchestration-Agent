using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Application.Features.Auth.Dtos;
using AiContentFlow.Application.Features.Auth.Validators;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
        var teamService = new Mock<ITeamService>();
        var transaction = new Mock<IApplicationTransaction>();

        transaction.Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(func => func());

        identityService.Setup(x => x.RegisterAsync("user@example.com", "P@ssw0rd123", "ousse"))
            .ReturnsAsync((true, "user-1", "user@example.com", "ousse", Enumerable.Empty<string>()));

        teamService.Setup(x => x.TryResolveInvitationForRegistrationAsync(null, "user@example.com"))
            .ReturnsAsync((ValueTuple<TeamInvitation, TeamRole>?)null);

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

        var service = CreateAuthService(identityService.Object, jwtGenerator.Object, refreshRepo.Object, teamRepo.Object, teamService.Object, transaction.Object);

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
        var teamService = new Mock<ITeamService>();
        var transaction = new Mock<IApplicationTransaction>();

        transaction.Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(func => func());

        identityService.Setup(x => x.RegisterAsync("user@example.com", "P@ssw0rd123", "ousse"))
            .ReturnsAsync((true, "user-1", "user@example.com", "ousse", Enumerable.Empty<string>()));

        teamService.Setup(x => x.TryResolveInvitationForRegistrationAsync(null, "user@example.com"))
            .ReturnsAsync((ValueTuple<TeamInvitation, TeamRole>?)null);

        jwtGenerator.Setup(x => x.GenerateToken("user-1", "user@example.com")).Returns("access-token");
        jwtGenerator.Setup(x => x.GenerateRefreshToken()).Returns("refresh-token");

        Team? capturedTeam = null;

        teamRepo.Setup(x => x.AddTeamAsync(It.IsAny<Team>()))
            .Callback<Team>(team => capturedTeam = team)
            .Returns(Task.CompletedTask);

        teamRepo.Setup(x => x.AddUserTeamAsync(It.IsAny<UserTeam>()))
            .Returns(Task.CompletedTask);

        var service = CreateAuthService(identityService.Object, jwtGenerator.Object, refreshRepo.Object, teamRepo.Object, teamService.Object, transaction.Object);

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

    [Fact]
    public async Task ForgotPasswordAsync_AlwaysReturnsGenericMessage()
    {
        var identityService = new Mock<IIdentityService>();
        identityService.Setup(x => x.GeneratePasswordResetTokenAsync("user@example.com"))
            .ReturnsAsync((string?)null);

        var service = CreateAuthService(
            identityService.Object,
            new Mock<IJwtTokenGenerator>().Object,
            new Mock<IRefreshTokenRepository>().Object,
            new Mock<ITeamRepository>().Object,
            new Mock<ITeamService>().Object,
            new Mock<IApplicationTransaction>().Object);

        var result = await service.ForgotPasswordAsync(new ForgotPasswordRequestDto { Email = "user@example.com" });

        Assert.Contains("If an account exists", result.Message);
    }

    private static AuthService CreateAuthService(
        IIdentityService identityService,
        IJwtTokenGenerator jwtGenerator,
        IRefreshTokenRepository refreshRepo,
        ITeamRepository teamRepo,
        ITeamService teamService,
        IApplicationTransaction transaction)
    {
        return new AuthService(
            identityService,
            jwtGenerator,
            refreshRepo,
            teamRepo,
            teamService,
            transaction,
            new Mock<IEmailService>().Object,
            Options.Create(new AppSettings { FrontendBaseUrl = "http://localhost:5173" }),
            new Mock<ILogger<AuthService>>().Object,
            new ForgotPasswordRequestDtoValidator(),
            new ResetPasswordRequestDtoValidator(),
            new ChangePasswordRequestDtoValidator(),
            new LogoutRequestDtoValidator());
    }
}
