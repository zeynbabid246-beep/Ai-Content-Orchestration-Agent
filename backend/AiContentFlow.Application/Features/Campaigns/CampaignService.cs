using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Campaigns.Dtos;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Features.Campaigns;

public class CampaignService : ICampaignService
{
    private readonly ICampaignRepository _campaignRepository;
    private readonly ICampaignContentPostRepository _campaignContentPostRepository;
    private readonly IContentPostRepository _contentPostRepository;
    private readonly ITeamRepository _teamRepository;

    public CampaignService(
        ICampaignRepository campaignRepository,
        ICampaignContentPostRepository campaignContentPostRepository,
        IContentPostRepository contentPostRepository,
        ITeamRepository teamRepository)
    {
        _campaignRepository = campaignRepository;
        _campaignContentPostRepository = campaignContentPostRepository;
        _contentPostRepository = contentPostRepository;
        _teamRepository = teamRepository;
    }

    public async Task<CampaignResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateCampaignDto dto)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        await EnsureCanMutateAsync(teamId, requestingUserId);

        var normalizedName = NormalizeRequired(dto.Name);

        if (await _campaignRepository.ExistsByNameAsync(teamId, normalizedName))
            throw new InvalidOperationException("Campaign name already exists for this team");

        var campaign = new Campaign
        {
            TeamId = teamId,
            Name = normalizedName,
            Description = Normalize(dto.Description),
            Status = dto.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _campaignRepository.AddAsync(campaign);
        await _campaignRepository.SaveChangesAsync();

        return Map(campaign);
    }

    public async Task<List<CampaignResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var campaigns = await _campaignRepository.GetByTeamAsync(teamId);
        return campaigns.Select(Map).ToList();
    }

    public async Task<CampaignResponseDto> GetByIdAsync(Guid teamId, int campaignId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        return Map(campaign);
    }

    public async Task<CampaignResponseDto> UpdateAsync(Guid teamId, int campaignId, string requestingUserId, UpdateCampaignDto dto)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        var normalizedName = NormalizeRequired(dto.Name);

        if (await _campaignRepository.ExistsByNameAsync(teamId, normalizedName, campaignId))
            throw new InvalidOperationException("Campaign name already exists for this team");

        campaign.Name = normalizedName;
        campaign.Description = Normalize(dto.Description);
        campaign.Status = dto.Status;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _campaignRepository.SaveChangesAsync();

        return Map(campaign);
    }

    public async Task DeleteAsync(Guid teamId, int campaignId, string requestingUserId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        var campaign = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        campaign.IsDeleted = true;
        campaign.DeletedAt = DateTime.UtcNow;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _campaignRepository.SaveChangesAsync();
    }

    public async Task LinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        _ = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        _ = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        var existingLink = await _campaignContentPostRepository.GetByIdsAsync(campaignId, contentPostId);
        if (existingLink is not null)
            throw new InvalidOperationException("Content post is already linked to this campaign");

        var link = new CampaignContentPost
        {
            CampaignId = campaignId,
            ContentPostId = contentPostId,
            LinkedAt = DateTime.UtcNow,
            LinkedByUserId = requestingUserId
        };

        await _campaignContentPostRepository.AddAsync(link);
        await _campaignContentPostRepository.SaveChangesAsync();
    }

    public async Task UnlinkContentPostAsync(Guid teamId, int campaignId, string requestingUserId, int contentPostId)
    {
        await EnsureCanMutateAsync(teamId, requestingUserId);

        _ = await _campaignRepository.GetByIdAsync(teamId, campaignId)
            ?? throw new KeyNotFoundException("Campaign not found");

        _ = await _contentPostRepository.GetByIdAsync(teamId, contentPostId)
            ?? throw new KeyNotFoundException("Content post not found");

        var existingLink = await _campaignContentPostRepository.GetByIdsAsync(campaignId, contentPostId)
            ?? throw new KeyNotFoundException("Campaign-content post link not found");

        await _campaignContentPostRepository.RemoveAsync(existingLink);
        await _campaignContentPostRepository.SaveChangesAsync();
    }

    private async Task EnsureCanMutateAsync(Guid teamId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Owner && membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Owner/Admin can manage campaigns");
    }

    private static CampaignResponseDto Map(Campaign campaign)
    {
        var links = campaign.CampaignContentPosts
            .Select(link => new CampaignContentPostResponseDto(link.ContentPostId, link.LinkedAt, link.LinkedByUserId))
            .ToList();

        return new CampaignResponseDto(
            campaign.Id,
            campaign.TeamId,
            campaign.Name,
            campaign.Description,
            campaign.Status,
            campaign.CreatedAt,
            campaign.UpdatedAt,
            links);
    }

    private static string NormalizeRequired(string value)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("Campaign name is required");

        return normalized;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
