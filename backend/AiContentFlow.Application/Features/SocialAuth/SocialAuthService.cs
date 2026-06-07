using AiContentFlow.Application.Common;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.SocialAuth.Dtos;
using AiContentFlow.Domain.Models;
using Application.Interfaces;

namespace AiContentFlow.Application.Features.SocialAuth;

public class SocialAuthService
{
    private static readonly SocialPlatform[] SupportedAuthPlatforms =
        [SocialPlatform.LinkedIn, SocialPlatform.Facebook, SocialPlatform.Instagram, SocialPlatform.Threads];
    private readonly IAuthServiceFactory _authServiceFactory;
    private readonly IChannelRepository _channelRepository;
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly IChannelSocialAccountRepository _channelSocialAccountRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly ISocialAuthStateService _stateService;
    private readonly ISocialCredentialStore _credentialStore;
    private readonly ITeamActivityService _activityService;

    public SocialAuthService(
        IAuthServiceFactory authServiceFactory,
        IChannelRepository channelRepository,
        ISocialAccountRepository socialAccountRepository,
        IChannelSocialAccountRepository channelSocialAccountRepository,
        ITeamRepository teamRepository,
        ISocialAuthStateService stateService,
        ISocialCredentialStore credentialStore,
        ITeamActivityService activityService)
    {
        _authServiceFactory = authServiceFactory;
        _channelRepository = channelRepository;
        _socialAccountRepository = socialAccountRepository;
        _channelSocialAccountRepository = channelSocialAccountRepository;
        _teamRepository = teamRepository;
        _stateService = stateService;
        _credentialStore = credentialStore;
        _activityService = activityService;
    }

    public async Task<SocialAuthLoginResultDto> CreateLoginUrlAsync(
        Guid teamId,
        int? linkChannelId,
        string requestingUserId,
        string platform,
        string? redirectPath = null)
    {
        EnsurePlatformIsSupported(platform);
        await EnsureCanManageSocialAccountsAsync(teamId, requestingUserId);

        if (linkChannelId.HasValue)
        {
            _ = await _channelRepository.GetByIdAsync(teamId, linkChannelId.Value)
                ?? throw new KeyNotFoundException("Channel not found");
        }

        var signedState = _stateService.CreateState(
            teamId,
            linkChannelId,
            requestingUserId,
            platform,
            DateTime.UtcNow,
            redirectPath);
        var service = _authServiceFactory.GetService(platform);
        var url = service.GetAuthUrl(signedState);

        return new SocialAuthLoginResultDto(teamId, linkChannelId, platform, url);
    }

    public async Task<SocialAuthCallbackResultDto> HandleCallbackAsync(
        string platform,
        string code,
        string state,
        string? requestingUserId = null)
    {
        EnsurePlatformIsSupported(platform);
        var validatedState = _stateService.ValidateState(state, platform, DateTime.UtcNow, requestingUserId);
        await EnsureCanManageSocialAccountsAsync(validatedState.TeamId, validatedState.UserId);

        var service = _authServiceFactory.GetService(platform);
        var authResult = await service.ProcessCallbackAsync(code, state);
        var accountsToPersist = FilterAccountsForPlatform(authResult.Accounts, validatedState.Platform);

        var results = new List<SocialAccountAuthResultDto>();

        foreach (var account in accountsToPersist)
        {
            var normalizedHandle = NormalizeRequired(account.AccountHandle);
            var accountPlatform = Enum.Parse<SocialPlatform>(account.Platform, true);
            var existing = await _socialAccountRepository.GetByExternalAccountIdForTeamAsync(
                validatedState.TeamId,
                accountPlatform,
                account.ExternalAccountId);

            var socialAccount = existing;
            if (socialAccount == null)
            {
                socialAccount = new SocialAccount
                {
                    TeamId = validatedState.TeamId,
                    Platform = accountPlatform,
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
                socialAccount.IsDeleted = false;
                socialAccount.DeletedAt = null;
                socialAccount.UpdatedAt = DateTime.UtcNow;
            }

            await _credentialStore.StoreAsync(socialAccount, account.AccessToken, account.RefreshToken, account.TokenExpiry);

            await _socialAccountRepository.DeactivateDuplicateAccountsForTeamAsync(
                validatedState.TeamId,
                accountPlatform,
                account.ExternalAccountId,
                socialAccount.Id);

            if (socialAccount.Id == 0)
                await _socialAccountRepository.SaveChangesAsync();

            if (validatedState.LinkChannelId.HasValue)
            {
                await EnsureChannelLinkAsync(
                    validatedState.TeamId,
                    validatedState.LinkChannelId.Value,
                    socialAccount);
            }

            results.Add(new SocialAccountAuthResultDto(
                socialAccount.Id,
                socialAccount.Platform.ToString(),
                socialAccount.ExternalAccountId,
                socialAccount.AccountName,
                socialAccount.AccountHandle,
                socialAccount.DisplayName,
                socialAccount.TokenExpiry));
        }

        await _socialAccountRepository.SaveChangesAsync();
        await _channelSocialAccountRepository.SaveChangesAsync();

        await _activityService.LogAsync(
            validatedState.TeamId,
            validatedState.UserId,
            TeamActivityActions.SocialAccountConnected,
            "SocialAccount",
            platform,
            $"{{\"linkChannelId\":{validatedState.LinkChannelId?.ToString() ?? "null"},\"accounts\":{results.Count}}}");

        return new SocialAuthCallbackResultDto(
            validatedState.LinkChannelId,
            validatedState.TeamId,
            validatedState.RedirectPath,
            results);
    }

    private async Task EnsureChannelLinkAsync(Guid teamId, int channelId, SocialAccount socialAccount)
    {
        _ = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        if (await _channelSocialAccountRepository.IsLinkedAsync(teamId, channelId, socialAccount.Id))
            return;

        await _channelSocialAccountRepository.UnlinkPlatformFromChannelAsync(teamId, channelId, socialAccount.Platform);

        await _channelSocialAccountRepository.LinkAsync(new ChannelSocialAccount
        {
            ChannelId = channelId,
            SocialAccountId = socialAccount.Id,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static void EnsurePlatformIsSupported(string platform)
    {
        if (!Enum.TryParse<SocialPlatform>(platform, true, out var normalizedPlatform)
            || !SupportedAuthPlatforms.Contains(normalizedPlatform))
            throw new NotSupportedException($"Platform '{platform}' is not supported for OAuth connection yet.");
    }

    private static List<SocialAccountAuthDto> FilterAccountsForPlatform(
        IReadOnlyList<SocialAccountAuthDto> accounts,
        string oauthPlatform)
    {
        if (!Enum.TryParse<SocialPlatform>(oauthPlatform, true, out var requestedPlatform))
            return accounts.ToList();

        var filtered = accounts
            .Where(account => Enum.TryParse<SocialPlatform>(account.Platform, true, out var accountPlatform)
                && accountPlatform == requestedPlatform)
            .ToList();

        if (filtered.Count > 0)
            return filtered;

        throw requestedPlatform switch
        {
            SocialPlatform.Instagram => new InvalidOperationException(
                "No Instagram Business account was found. Link Instagram to a Facebook Page as Business or Creator, " +
                "grant Page access during login, and reconnect."),
            SocialPlatform.Facebook => new InvalidOperationException(
                "No Facebook Page was found for this Meta account."),
            SocialPlatform.Threads => new InvalidOperationException(
                "No Threads profile was found for this Meta account."),
            _ => new InvalidOperationException("No accounts were returned from the provider.")
        };
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
}
