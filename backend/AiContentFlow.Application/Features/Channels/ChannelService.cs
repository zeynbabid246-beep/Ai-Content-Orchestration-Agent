using AiContentFlow.Application.Common.Authorization;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Channels.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.Channels;

public class ChannelService : IChannelService
{
    private readonly IChannelRepository _channelRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly IValidator<CreateChannelDto> _createValidator;
    private readonly IValidator<UpdateChannelDto> _updateValidator;

    public ChannelService(
        IChannelRepository channelRepository,
        ITeamRepository teamRepository,
        IBrandStudioRepository brandStudioRepository,
        IValidator<CreateChannelDto> createValidator,
        IValidator<UpdateChannelDto> updateValidator)
    {
        _channelRepository = channelRepository;
        _teamRepository = teamRepository;
        _brandStudioRepository = brandStudioRepository;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<ChannelResponseDto> CreateAsync(Guid teamId, string requestingUserId, CreateChannelDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);

        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        TeamAuthorization.EnsureCanManageChannels(membership);

        var name = NormalizeRequired(dto.Name);
        var normalizedName = NormalizeKey(name);

        if (await _channelRepository.ExistsByNameAsync(teamId, normalizedName))
            throw new InvalidOperationException("Channel name already exists for this team");

        var defaults = await _brandStudioRepository.GetByTeamAsync(teamId);

        var channel = new Channel
        {
            TeamId = teamId,
            Name = name,
            NormalizedName = normalizedName,
            Description = Normalize(dto.Description),
            Branding = MapBranding(dto.Branding, defaults),
            Config = MapConfig(dto.Config),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _channelRepository.AddAsync(channel);
        await _channelRepository.SaveChangesAsync();

        return Map(channel);
    }

    public async Task<List<ChannelResponseDto>> GetByTeamAsync(Guid teamId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var channels = await _channelRepository.GetByTeamAsync(teamId);
        return channels.Select(Map).ToList();
    }

    public async Task<ChannelResponseDto> GetByIdAsync(Guid teamId, int channelId, string requestingUserId)
    {
        _ = await _teamRepository.GetTeamByIdAsync(teamId)
            ?? throw new KeyNotFoundException("Team not found");

        if (!await _teamRepository.IsUserMemberAsync(teamId, requestingUserId))
            throw new UnauthorizedAccessException("Not a team member");

        var channel = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        return Map(channel);
    }

    public async Task<ChannelResponseDto> UpdateAsync(Guid teamId, int channelId, string requestingUserId, UpdateChannelDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);

        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        TeamAuthorization.EnsureCanManageChannels(membership);

        var channel = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var name = NormalizeRequired(dto.Name);
        var normalizedName = NormalizeKey(name);

        if (await _channelRepository.ExistsByNameAsync(teamId, normalizedName, channelId))
            throw new InvalidOperationException("Channel name already exists for this team");

        channel.Name = name;
        channel.NormalizedName = normalizedName;
        channel.Description = Normalize(dto.Description);
        channel.Branding = ApplyBranding(channel.Branding, dto.Branding);
        channel.Config = ApplyConfig(channel.Config, dto.Config);
        channel.UpdatedAt = DateTime.UtcNow;

        await _channelRepository.SaveChangesAsync();

        return Map(channel);
    }

    public async Task DeleteAsync(Guid teamId, int channelId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        TeamAuthorization.EnsureCanManageChannels(membership);

        var channel = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        channel.IsDeleted = true;
        channel.DeletedAt = DateTime.UtcNow;
        channel.UpdatedAt = DateTime.UtcNow;

        await _channelRepository.SaveChangesAsync();
    }

    private static ChannelResponseDto Map(Channel channel)
    {
        return new ChannelResponseDto(
            channel.Id,
            channel.TeamId,
            channel.Name,
            channel.Description,
            MapBranding(channel.Branding),
            MapConfig(channel.Config),
            channel.CreatedAt,
            channel.UpdatedAt);
    }

    private static ChannelBranding? MapBranding(ChannelBrandingDto? dto, TeamBrandStudio? defaults = null)
    {
        if (dto is null && defaults is null)
        {
            return null;
        }

        return new ChannelBranding
        {
            LogoUrl = Normalize(dto?.LogoUrl),
            Theme = Normalize(dto?.Theme),
            Slogan = Normalize(dto?.Slogan),
            Tone = Normalize(dto?.Tone) ?? defaults?.DefaultToneOfVoice,
            TargetAudience = Normalize(dto?.TargetAudience) ?? defaults?.DefaultTargetAudience,
            KeywordsCsv = ToCsv(dto?.Keywords) ?? JoinList(defaults?.ContentPillars),
            ContentPillarsCsv = ToCsv(dto?.ContentPillars) ?? JoinList(defaults?.DefaultContentPillars),
            Mission = Normalize(dto?.Mission) ?? defaults?.DefaultMission,
            BrandSummary = Normalize(dto?.BrandSummary) ?? defaults?.DefaultBrandSummary,
            Goal = Normalize(dto?.Goal) ?? defaults?.DefaultCampaignObjective,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static ChannelConfig? MapConfig(ChannelConfigDto? dto)
    {
        if (dto is null)
        {
            return null;
        }

        return new ChannelConfig
        {
            SettingsJson = dto?.SettingsJson?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private static ChannelBranding? ApplyBranding(ChannelBranding? existing, ChannelBrandingDto? dto)
    {
        if (dto is null)
        {
            return existing;
        }

        if (existing is null)
        {
            return MapBranding(dto);
        }

        existing.LogoUrl = Normalize(dto.LogoUrl);
        existing.Theme = Normalize(dto.Theme);
        existing.Slogan = Normalize(dto.Slogan);
        existing.Tone = Normalize(dto.Tone);
        existing.TargetAudience = Normalize(dto.TargetAudience);
        existing.KeywordsCsv = ToCsv(dto.Keywords);
        existing.ContentPillarsCsv = ToCsv(dto.ContentPillars);
        existing.Mission = Normalize(dto.Mission);
        existing.BrandSummary = Normalize(dto.BrandSummary);
        existing.Goal = Normalize(dto.Goal);
        existing.UpdatedAt = DateTime.UtcNow;
        return existing;
    }

    private static ChannelConfig? ApplyConfig(ChannelConfig? existing, ChannelConfigDto? dto)
    {
        if (dto is null)
        {
            return existing;
        }

        if (existing is null)
        {
            return MapConfig(dto);
        }

        existing.SettingsJson = dto.SettingsJson?.Trim() ?? string.Empty;
        existing.UpdatedAt = DateTime.UtcNow;
        return existing;
    }

    private static ChannelBrandingDto? MapBranding(ChannelBranding? branding)
    {
        return branding == null
            ? null
            : new ChannelBrandingDto(
                branding.LogoUrl,
                branding.Theme,
                branding.Slogan,
                branding.Tone,
                branding.TargetAudience,
                ReadCsv(branding.KeywordsCsv),
                ReadCsv(branding.ContentPillarsCsv),
                branding.Mission,
                branding.BrandSummary,
                branding.Goal);
    }

    private static ChannelConfigDto? MapConfig(ChannelConfig? config)
    {
        return config == null
            ? null
            : new ChannelConfigDto(config.SettingsJson);
    }

    private static string NormalizeRequired(string value)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("Channel name is required");

        return normalized;
    }

    private static string NormalizeKey(string value)
    {
        return value.Trim().ToUpperInvariant();
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static IReadOnlyList<string>? ReadCsv(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
            return null;

        return csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string? ToCsv(IReadOnlyList<string>? values)
    {
        if (values is null || values.Count == 0)
            return null;

        return string.Join(", ", values
            .Select(v => v?.Trim())
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => v!)
            .Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static string? JoinList(IReadOnlyList<string>? values)
    {
        if (values is null || values.Count == 0)
            return null;

        return string.Join(", ", values);
    }
}