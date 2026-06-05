using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Channels.Dtos;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Channels;

public class ChannelSocialAccountService : IChannelSocialAccountService
{
    private readonly IChannelRepository _channelRepository;
    private readonly ISocialAccountRepository _socialAccountRepository;
    private readonly IChannelSocialAccountRepository _channelSocialAccountRepository;
    private readonly ITeamRepository _teamRepository;

    public ChannelSocialAccountService(
        IChannelRepository channelRepository,
        ISocialAccountRepository socialAccountRepository,
        IChannelSocialAccountRepository channelSocialAccountRepository,
        ITeamRepository teamRepository)
    {
        _channelRepository = channelRepository;
        _socialAccountRepository = socialAccountRepository;
        _channelSocialAccountRepository = channelSocialAccountRepository;
        _teamRepository = teamRepository;
    }

    public async Task<ChannelSocialAccountsResponseDto> GetChannelSocialAccountsAsync(
        Guid teamId,
        int channelId,
        string requestingUserId)
    {
        await EnsureMemberAsync(teamId, requestingUserId);
        _ = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var teamAccounts = await _socialAccountRepository.GetByTeamAsync(teamId);
        var linkMap = await _channelSocialAccountRepository.GetLinkedChannelIdsByAccountIdsAsync(
            teamId,
            teamAccounts.Select(a => a.Id));

        var linkedIds = await _channelSocialAccountRepository.GetLinkedSocialAccountIdsAsync(teamId, channelId);
        var linkedIdSet = linkedIds.ToHashSet();

        return new ChannelSocialAccountsResponseDto(
            teamAccounts.Where(a => linkedIdSet.Contains(a.Id)).Select(a => Map(a, linkMap)).ToList(),
            teamAccounts.Select(a => Map(a, linkMap)).ToList());
    }

    public async Task LinkAsync(Guid teamId, int channelId, string requestingUserId, LinkChannelSocialAccountDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        _ = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var socialAccount = await _socialAccountRepository.GetByIdAsync(teamId, dto.SocialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        if (await _channelSocialAccountRepository.IsLinkedAsync(teamId, channelId, socialAccount.Id))
            return;

        await _channelSocialAccountRepository.UnlinkPlatformFromChannelAsync(teamId, channelId, socialAccount.Platform);

        await _channelSocialAccountRepository.LinkAsync(new ChannelSocialAccount
        {
            ChannelId = channelId,
            SocialAccountId = socialAccount.Id,
            CreatedAt = DateTime.UtcNow
        });

        await _channelSocialAccountRepository.SaveChangesAsync();
    }

    public async Task UnlinkAsync(Guid teamId, int channelId, int socialAccountId, string requestingUserId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);
        _ = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        _ = await _socialAccountRepository.GetByIdAsync(teamId, socialAccountId)
            ?? throw new KeyNotFoundException("Social account not found");

        await _channelSocialAccountRepository.UnlinkAsync(teamId, channelId, socialAccountId);
        await _channelSocialAccountRepository.SaveChangesAsync();
    }

    private static SocialAccountResponseDto Map(SocialAccount account, Dictionary<int, List<int>> linkMap)
    {
        linkMap.TryGetValue(account.Id, out var channelIds);
        return new SocialAccountResponseDto(
            account.Id,
            account.TeamId,
            account.Platform,
            account.Status,
            account.AccountHandle,
            account.DisplayName,
            account.ExternalAccountId,
            account.CreatedAt,
            account.UpdatedAt,
            channelIds ?? []);
    }

    private async Task EnsureMemberAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");
    }

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException("Only Admin or Editor can manage channel social links");
    }
}
