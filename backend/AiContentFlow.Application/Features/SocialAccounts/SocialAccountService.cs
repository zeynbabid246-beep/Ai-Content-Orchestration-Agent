using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.SocialAccounts;

public class SocialAccountService : ISocialAccountService
{
    private static readonly SocialPlatform[] SupportedPlatforms =
        [SocialPlatform.LinkedIn, SocialPlatform.Facebook, SocialPlatform.Instagram];
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly IChannelSocialAccountRepository _channelSocialAccountRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IValidator<CreateSocialAccountDto> _createValidator;
    private readonly IValidator<UpdateSocialAccountDto> _updateValidator;

    public SocialAccountService(
        ISocialAccountRepository socialAccountRepository,
        IChannelSocialAccountRepository channelSocialAccountRepository,
        ITeamRepository teamRepository,
        IValidator<CreateSocialAccountDto> createValidator,
        IValidator<UpdateSocialAccountDto> updateValidator)
    {
        _socialAccountRepository = socialAccountRepository;
        _channelSocialAccountRepository = channelSocialAccountRepository;
        _teamRepository = teamRepository;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<SocialAccountResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateSocialAccountDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);
        EnsurePlatformIsEnabled(dto.Platform);

        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage social accounts");

        var normalizedHandle = NormalizeRequired(dto.AccountHandle);

        if (await _socialAccountRepository.ExistsAsync(teamId, dto.Platform, normalizedHandle))
            throw new InvalidOperationException("Social account already exists for this team and platform");

        var socialAccount = new SocialAccount
        {
            TeamId = teamId,
            Platform = dto.Platform,
            Status = SocialAccountStatus.Active,
            AccountHandle = normalizedHandle,
            DisplayName = Normalize(dto.DisplayName),
            ExternalAccountId = Normalize(dto.ExternalAccountId) ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _socialAccountRepository.AddAsync(socialAccount);
        await _socialAccountRepository.SaveChangesAsync();

        return Map(socialAccount, []);
    }

    public async Task<List<SocialAccountResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var socialAccounts = await _socialAccountRepository.GetByTeamAsync(teamId);
        var linkMap = await _channelSocialAccountRepository.GetLinkedChannelIdsByAccountIdsAsync(
            teamId,
            socialAccounts.Select(a => a.Id));

        return socialAccounts.Select(a => Map(a, linkMap)).ToList();
    }

    public async Task<SocialAccountResponseDto> GetByIdAsync(Guid teamId, int socialAccountId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        var linkMap = await _channelSocialAccountRepository.GetLinkedChannelIdsByAccountIdsAsync(
            teamId,
            [socialAccount.Id]);

        return Map(socialAccount, linkMap);
    }

    public async Task<SocialAccountResponseDto> UpdateAsync(Guid teamId, int socialAccountId, string requestingUserId, UpdateSocialAccountDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);
        EnsurePlatformIsEnabled(dto.Platform);

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage social accounts");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        var normalizedHandle = NormalizeRequired(dto.AccountHandle);

        if (await _socialAccountRepository.ExistsAsync(teamId, dto.Platform, normalizedHandle, socialAccountId))
            throw new InvalidOperationException("Social account already exists for this team and platform");

        socialAccount.Platform = dto.Platform;
        socialAccount.Status = dto.Status;
        socialAccount.AccountHandle = normalizedHandle;
        socialAccount.DisplayName = Normalize(dto.DisplayName);
        socialAccount.ExternalAccountId = Normalize(dto.ExternalAccountId) ?? string.Empty;
        socialAccount.UpdatedAt = DateTime.UtcNow;

        await _socialAccountRepository.SaveChangesAsync();

        var linkMap = await _channelSocialAccountRepository.GetLinkedChannelIdsByAccountIdsAsync(
            teamId,
            [socialAccount.Id]);

        return Map(socialAccount, linkMap);
    }

    public async Task DeleteAsync(Guid teamId, int socialAccountId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage social accounts");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        await _channelSocialAccountRepository.RemoveAllLinksForAccountAsync(socialAccountId);

        socialAccount.IsDeleted = true;
        socialAccount.DeletedAt = DateTime.UtcNow;
        socialAccount.UpdatedAt = DateTime.UtcNow;

        await _socialAccountRepository.SaveChangesAsync();
        await _channelSocialAccountRepository.SaveChangesAsync();
    }

    private static SocialAccountResponseDto Map(SocialAccount socialAccount, Dictionary<int, List<int>> linkMap)
    {
        linkMap.TryGetValue(socialAccount.Id, out var channelIds);
        return new SocialAccountResponseDto(
            socialAccount.Id,
            socialAccount.TeamId,
            socialAccount.Platform,
            socialAccount.Status,
            socialAccount.AccountHandle,
            socialAccount.DisplayName,
            socialAccount.ExternalAccountId,
            socialAccount.CreatedAt,
            socialAccount.UpdatedAt,
            channelIds ?? []);
    }

    private static string NormalizeRequired(string value)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("Account handle is required");

        return normalized;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static void EnsurePlatformIsEnabled(SocialPlatform platform)
    {
        if (!SupportedPlatforms.Contains(platform))
            throw new InvalidOperationException($"Platform '{platform}' is not enabled yet.");
    }
}
