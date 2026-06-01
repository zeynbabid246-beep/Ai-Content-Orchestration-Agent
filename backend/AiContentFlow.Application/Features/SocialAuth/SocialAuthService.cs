using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.SocialAuth.Dtos;
using AiContentFlow.Domain.Models;
using Application.Interfaces;

namespace AiContentFlow.Application.Features.SocialAuth;

public class SocialAuthService
{
    private const string DefaultChannelName = "General";
    private static readonly SocialPlatform[] SupportedAuthPlatforms =
        [SocialPlatform.LinkedIn, SocialPlatform.Facebook, SocialPlatform.Instagram];
    private readonly IAuthServiceFactory _authServiceFactory;
    private readonly IChannelRepository _channelRepository;
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly ISocialAuthStateService _stateService;
    private readonly ISocialCredentialStore _credentialStore;

    public SocialAuthService(
        IAuthServiceFactory authServiceFactory,
        IChannelRepository channelRepository,
        ISocialAccountRepository socialAccountRepository,
        ITeamRepository teamRepository,
        ISocialAuthStateService stateService,
        ISocialCredentialStore credentialStore)
    {
        _authServiceFactory = authServiceFactory;
        _channelRepository = channelRepository;
        _socialAccountRepository = socialAccountRepository;
        _teamRepository = teamRepository;
        _stateService = stateService;
        _credentialStore = credentialStore;
    }

    public async Task<SocialAuthLoginResultDto> CreateLoginUrlAsync(Guid teamId, int? channelId, string requestingUserId, string platform)
    {
        EnsurePlatformIsSupported(platform);
        await EnsureCanManageSocialAccountsAsync(teamId, requestingUserId);

        var resolvedChannelId = await ResolveChannelIdAsync(teamId, channelId);

        var signedState = _stateService.CreateState(teamId, resolvedChannelId, requestingUserId, platform, DateTime.UtcNow);
        var service = _authServiceFactory.GetService(platform);
        var url = service.GetAuthUrl(signedState);

        return new SocialAuthLoginResultDto(teamId, resolvedChannelId, platform, url);
    }

    public async Task<SocialAuthCallbackResultDto> HandleCallbackAsync(string platform, string code, string state, string? requestingUserId = null)
    {
        EnsurePlatformIsSupported(platform);
        var validatedState = _stateService.ValidateState(state, platform, DateTime.UtcNow, requestingUserId);
        await EnsureCanManageSocialAccountsAsync(validatedState.TeamId, validatedState.UserId);

        var service = _authServiceFactory.GetService(platform);
        var authResult = await service.ProcessCallbackAsync(code, state);

        var channel = await _channelRepository.GetByIdAsync(validatedState.TeamId, validatedState.ChannelId);
        if (channel == null)
            throw new KeyNotFoundException("Channel not found");

        var results = new List<SocialAccountAuthResultDto>();

        foreach (var account in authResult.Accounts)
        {
            var normalizedHandle = NormalizeRequired(account.AccountHandle);
            var existing = await _socialAccountRepository.GetByExternalAccountIdAsync(
                channel.TeamId,
                channel.Id,
                Enum.Parse<SocialPlatform>(account.Platform, true),
                account.ExternalAccountId);

            var socialAccount = existing;
            if (socialAccount == null)
            {
                socialAccount = new SocialAccount
                {
                    TeamId = channel.TeamId,
                    ChannelId = channel.Id,
                    Platform = Enum.Parse<SocialPlatform>(account.Platform, true),
                    Status = SocialAccountStatus.Active,
                    AccountName = Normalize(account.AccountName) ?? string.Empty,
                    AccountHandle = normalizedHandle,
                    DisplayName = Normalize(account.DisplayName),
                    ExternalAccountId = account.ExternalAccountId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _socialAccountRepository.AddAsync(socialAccount);
            }
            else
            {
                socialAccount.Status = SocialAccountStatus.Active;
                socialAccount.AccountName = Normalize(account.AccountName) ?? socialAccount.AccountName;
                socialAccount.AccountHandle = normalizedHandle;
                socialAccount.DisplayName = Normalize(account.DisplayName);
                socialAccount.ExternalAccountId = account.ExternalAccountId;
                socialAccount.IsActive = true;
                socialAccount.UpdatedAt = DateTime.UtcNow;
            }

            await _credentialStore.StoreAsync(socialAccount, account.AccessToken, account.RefreshToken, account.TokenExpiry);

            results.Add(new SocialAccountAuthResultDto(
                socialAccount.Id,
                socialAccount.ChannelId,
                socialAccount.Platform.ToString(),
                socialAccount.ExternalAccountId,
                socialAccount.AccountName,
                socialAccount.AccountHandle,
                socialAccount.DisplayName,
                socialAccount.TokenExpiry));
        }

        await _socialAccountRepository.SaveChangesAsync();

        return new SocialAuthCallbackResultDto(channel.Id, channel.TeamId, results);
    }

    private static void EnsurePlatformIsSupported(string platform)
    {
        if (!Enum.TryParse<SocialPlatform>(platform, true, out var normalizedPlatform)
            || !SupportedAuthPlatforms.Contains(normalizedPlatform))
            throw new NotSupportedException($"Platform '{platform}' is not supported for OAuth connection yet.");
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

    private async Task EnsureCanManageSocialAccountsAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage social account connections");
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
            Description = "Auto-created default channel for direct posting",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _channelRepository.AddAsync(channel);
        await _channelRepository.SaveChangesAsync();
        return channel.Id;
    }
}
