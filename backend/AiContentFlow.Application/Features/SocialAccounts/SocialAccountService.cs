using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.SocialAccounts;

public class SocialAccountService : ISocialAccountService
{
    private const string DefaultChannelName = "General";
    private static readonly SocialPlatform[] SupportedPlatforms = [SocialPlatform.LinkedIn, SocialPlatform.Facebook];
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly IChannelRepository _channelRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IValidator<CreateSocialAccountDto> _createValidator;
    private readonly IValidator<UpdateSocialAccountDto> _updateValidator;

    public SocialAccountService(
        ISocialAccountRepository socialAccountRepository,
        IChannelRepository channelRepository,
        ITeamRepository teamRepository,
        IValidator<CreateSocialAccountDto> createValidator,
        IValidator<UpdateSocialAccountDto> updateValidator)
    {
        _socialAccountRepository = socialAccountRepository;
        _channelRepository = channelRepository;
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

        var resolvedChannelId = await ResolveChannelIdAsync(teamId, dto.ChannelId);

        var normalizedHandle = NormalizeRequired(dto.AccountHandle);

        if (await _socialAccountRepository.ExistsAsync(teamId, resolvedChannelId, dto.Platform, normalizedHandle))
            throw new InvalidOperationException("Social account already exists for this channel and platform");

        var socialAccount = new SocialAccount
        {
            TeamId = teamId,
            ChannelId = resolvedChannelId,
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

        return Map(socialAccount);
    }

    public async Task<List<SocialAccountResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var socialAccounts = await _socialAccountRepository.GetByTeamAsync(teamId);
        return socialAccounts.Select(Map).ToList();
    }

    public async Task<SocialAccountResponseDto> GetByIdAsync(Guid teamId, int socialAccountId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        return Map(socialAccount);
    }

    public async Task<SocialAccountResponseDto> UpdateAsync(Guid teamId, int socialAccountId, string requestingUserId, UpdateSocialAccountDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);
        EnsurePlatformIsEnabled(dto.Platform);

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage social accounts");

        var resolvedChannelId = await ResolveChannelIdAsync(teamId, dto.ChannelId);

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        var normalizedHandle = NormalizeRequired(dto.AccountHandle);

        if (await _socialAccountRepository.ExistsAsync(teamId, resolvedChannelId, dto.Platform, normalizedHandle, socialAccountId))
            throw new InvalidOperationException("Social account already exists for this channel and platform");

        socialAccount.ChannelId = resolvedChannelId;
        socialAccount.Platform = dto.Platform;
        socialAccount.Status = dto.Status;
        socialAccount.AccountHandle = normalizedHandle;
        socialAccount.DisplayName = Normalize(dto.DisplayName);
        socialAccount.ExternalAccountId = Normalize(dto.ExternalAccountId) ?? string.Empty;
        socialAccount.UpdatedAt = DateTime.UtcNow;

        await _socialAccountRepository.SaveChangesAsync();

        return Map(socialAccount);
    }

    public async Task DeleteAsync(Guid teamId, int socialAccountId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage social accounts");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        socialAccount.IsDeleted = true;
        socialAccount.DeletedAt = DateTime.UtcNow;
        socialAccount.UpdatedAt = DateTime.UtcNow;

        await _socialAccountRepository.SaveChangesAsync();
    }

    private static SocialAccountResponseDto Map(SocialAccount socialAccount)
    {
        return new SocialAccountResponseDto(
            socialAccount.Id,
            socialAccount.TeamId,
            socialAccount.ChannelId,
            socialAccount.Platform,
            socialAccount.Status,
            socialAccount.AccountHandle,
            socialAccount.DisplayName,
            socialAccount.ExternalAccountId,
            socialAccount.CreatedAt,
            socialAccount.UpdatedAt);
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

    private async Task<int> ResolveChannelIdAsync(Guid teamId, int? requestedChannelId)
    {
        if (requestedChannelId.HasValue)
        {
            _ = await _channelRepository.GetByIdAsync(teamId, requestedChannelId.Value)
                ?? throw new KeyNotFoundException("Channel not found");
            return requestedChannelId.Value;
        }

        var channels = await _channelRepository.GetByTeamAsync(teamId);
        var existing = channels.FirstOrDefault();
        if (existing is not null)
            return existing.Id;

        var channel = new Channel
        {
            TeamId = teamId,
            Name = DefaultChannelName,
            NormalizedName = DefaultChannelName.ToUpperInvariant(),
            Description = "Auto-created default channel for direct social posting",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _channelRepository.AddAsync(channel);
        await _channelRepository.SaveChangesAsync();
        return channel.Id;
    }
}