using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.SocialAccounts;

public class SocialAccountService : ISocialAccountService
{
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

        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can manage social accounts");

        _ = await _channelRepository.GetByIdAsync(teamId, dto.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var normalizedHandle = NormalizeRequired(dto.AccountHandle);

        if (await _socialAccountRepository.ExistsAsync(teamId, dto.ChannelId, dto.Platform, normalizedHandle))
            throw new InvalidOperationException("Social account already exists for this channel and platform");

        var socialAccount = new SocialAccount
        {
            TeamId = teamId,
            ChannelId = dto.ChannelId,
            Platform = dto.Platform,
            Status = SocialAccountStatus.Active,
            AccountHandle = normalizedHandle,
            DisplayName = Normalize(dto.DisplayName),
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

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can manage social accounts");

        _ = await _channelRepository.GetByIdAsync(teamId, dto.ChannelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        var normalizedHandle = NormalizeRequired(dto.AccountHandle);

        if (await _socialAccountRepository.ExistsAsync(teamId, dto.ChannelId, dto.Platform, normalizedHandle, socialAccountId))
            throw new InvalidOperationException("Social account already exists for this channel and platform");

        socialAccount.ChannelId = dto.ChannelId;
        socialAccount.Platform = dto.Platform;
        socialAccount.Status = dto.Status;
        socialAccount.AccountHandle = normalizedHandle;
        socialAccount.DisplayName = Normalize(dto.DisplayName);
        socialAccount.UpdatedAt = DateTime.UtcNow;

        await _socialAccountRepository.SaveChangesAsync();

        return Map(socialAccount);
    }

    public async Task DeleteAsync(Guid teamId, int socialAccountId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can manage social accounts");

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
}