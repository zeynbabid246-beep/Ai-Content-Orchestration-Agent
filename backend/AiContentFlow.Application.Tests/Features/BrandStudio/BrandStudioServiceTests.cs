using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Application.Features.BrandStudio.Dtos;
using AiContentFlow.Application.Features.BrandStudio.Validators;
using AiContentFlow.Domain.Models;
using FluentValidation;
using Moq;
using Xunit;

namespace AiContentFlow.Application.Tests.Features.BrandStudio;

public class BrandStudioServiceTests
{
    [Fact]
    public async Task CreateManualAsync_WhenProfileDoesNotExist_CreatesBrandStudioWithoutImportJob()
    {
        var brandStudioRepo = new Mock<IBrandStudioRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(brandStudioRepo, teamRepo);

        var teamId = Guid.NewGuid();
        SetupAdmin(teamRepo, teamId, "admin-1");
        brandStudioRepo.Setup(x => x.GetByTeamAsync(teamId)).ReturnsAsync((TeamBrandStudio?)null);

        TeamBrandStudio? saved = null;
        brandStudioRepo.Setup(x => x.AddBrandStudioAsync(It.IsAny<TeamBrandStudio>()))
            .Callback<TeamBrandStudio>(studio => saved = studio)
            .Returns(Task.CompletedTask);
        brandStudioRepo.Setup(x => x.SaveChangesAsync()).Returns(Task.CompletedTask);

        var dto = CreateManualDto(brandName: "Acme Co", brandSummary: "B2B SaaS for marketers");

        var result = await service.CreateManualAsync(teamId, "admin-1", dto);

        Assert.Equal("Acme Co", result.ParsedProfile.BrandName);
        Assert.NotNull(saved);
        Assert.Equal($"team_{teamId:N}", saved!.OrgId);
        Assert.Equal("Acme Co", saved.BrandName);
    }

    [Fact]
    public async Task CreateManualAsync_WhenProfileAlreadyExists_ThrowsInvalidOperationException()
    {
        var brandStudioRepo = new Mock<IBrandStudioRepository>();
        var teamRepo = new Mock<ITeamRepository>();
        var service = CreateService(brandStudioRepo, teamRepo);

        var teamId = Guid.NewGuid();
        SetupAdmin(teamRepo, teamId, "admin-1");
        brandStudioRepo.Setup(x => x.GetByTeamAsync(teamId)).ReturnsAsync(new TeamBrandStudio
        {
            TeamId = teamId,
            BrandName = "Existing",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateManualAsync(teamId, "admin-1", CreateManualDto(brandName: "New Brand")));
    }

    [Fact]
    public async Task CreateManualValidator_AcceptsMissingWebsiteUrl_WhenBrandNamePresent()
    {
        var validator = new CreateManualBrandStudioDtoValidator();
        var dto = CreateManualDto(brandName: "Acme", websiteUrl: null);

        var result = await validator.ValidateAsync(dto);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task CreateManualValidator_RejectsWhenBrandNameAndSummaryMissing()
    {
        var validator = new CreateManualBrandStudioDtoValidator();
        var dto = CreateManualDto();

        var result = await validator.ValidateAsync(dto);

        Assert.False(result.IsValid);
    }

    private static CreateManualBrandStudioDto CreateManualDto(
        string? brandName = null,
        string? brandSummary = null,
        string? websiteUrl = null)
    {
        return new CreateManualBrandStudioDto(new BrandParsedProfileDto(
            OrgId: null,
            WebsiteUrl: websiteUrl,
            BrandName: brandName,
            BrandSummary: brandSummary,
            Slogan: null,
            ValueProposition: [],
            ToneOfVoice: [],
            AudienceSignals: [],
            ContentPillars: [],
            VisualIdentity: new BrandVisualIdentityDto(
                null, null, [], [], [], [], null, null, [], null, null, false, false),
            KeyMessages: [],
            BusinessInfo: null,
            Email: null));
    }

    private static void SetupAdmin(Mock<ITeamRepository> teamRepo, Guid teamId, string userId)
    {
        teamRepo.Setup(x => x.GetTeamByIdAsync(teamId))
            .ReturnsAsync(new Team { Id = teamId, Name = "Team", CreatedAt = DateTime.UtcNow });
        teamRepo.Setup(x => x.GetUserMembershipAsync(teamId, userId))
            .ReturnsAsync(new UserTeam
            {
                Id = Guid.NewGuid(),
                TeamId = teamId,
                UserId = userId,
                Role = TeamRole.Admin,
                JoinedAt = DateTime.UtcNow
            });
    }

    private static BrandStudioService CreateService(
        Mock<IBrandStudioRepository> brandStudioRepo,
        Mock<ITeamRepository> teamRepo)
    {
        return new BrandStudioService(
            brandStudioRepo.Object,
            teamRepo.Object,
            new Mock<IBrandImportJobScheduler>().Object,
            new CreateBrandImportDtoValidator(),
            new CreateManualBrandStudioDtoValidator());
    }
}
