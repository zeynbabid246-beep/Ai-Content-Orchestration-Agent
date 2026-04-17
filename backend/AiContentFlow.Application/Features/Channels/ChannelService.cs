using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Channels.Dtos;
using AiContentFlow.Domain.Models;
using FluentValidation;

namespace AiContentFlow.Application.Features.Channels;

public class ChannelService : IChannelService
{
    private readonly IChannelRepository _channelRepository;
    private readonly ITeamRepository _teamRepository;
    private readonly IValidator<CreateChannelDto> _createValidator;
    private readonly IValidator<UpdateChannelDto> _updateValidator;

    public ChannelService(
        IChannelRepository channelRepository,
        ITeamRepository teamRepository,
        IValidator<CreateChannelDto> createValidator,
        IValidator<UpdateChannelDto> updateValidator)
    {
        _channelRepository = channelRepository;
        _teamRepository = teamRepository;
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

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can manage channels");

        var name = NormalizeRequired(dto.Name);
        var normalizedName = NormalizeKey(name);

        if (await _channelRepository.ExistsByNameAsync(teamId, normalizedName))
            throw new InvalidOperationException("Channel name already exists for this team");

        var channel = new Channel
        {
            TeamId = teamId,
            Name = name,
            NormalizedName = normalizedName,
            Description = Normalize(dto.Description),
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

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can manage channels");

        var channel = await _channelRepository.GetByIdAsync(teamId, channelId)
            ?? throw new KeyNotFoundException("Channel not found");

        var name = NormalizeRequired(dto.Name);
        var normalizedName = NormalizeKey(name);

        if (await _channelRepository.ExistsByNameAsync(teamId, normalizedName, channelId))
            throw new InvalidOperationException("Channel name already exists for this team");

        channel.Name = name;
        channel.NormalizedName = normalizedName;
        channel.Description = Normalize(dto.Description);
        channel.UpdatedAt = DateTime.UtcNow;

        await _channelRepository.SaveChangesAsync();

        return Map(channel);
    }

    public async Task DeleteAsync(Guid teamId, int channelId, string requestingUserId)
    {
        var membership = await _teamRepository.GetUserMembershipAsync(teamId, requestingUserId)
            ?? throw new UnauthorizedAccessException("Not a team member");

        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException("Only Admin can manage channels");

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
            channel.CreatedAt,
            channel.UpdatedAt);
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
}