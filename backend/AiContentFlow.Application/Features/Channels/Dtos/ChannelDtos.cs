namespace AiContentFlow.Application.Features.Channels.Dtos;

public record ChannelBrandingDto(
    string? LogoUrl,
    string? Theme,
    string? Slogan,
    string? Tone);

public record ChannelConfigDto(
    string? SettingsJson);

public record CreateChannelDto(
    string Name,
    string? Description,
    ChannelBrandingDto? Branding,
    ChannelConfigDto? Config
);

public record UpdateChannelDto(
    string Name,
    string? Description,
    ChannelBrandingDto? Branding,
    ChannelConfigDto? Config
);

public record ChannelResponseDto(
    int Id,
    Guid TeamId,
    string Name,
    string? Description,
    ChannelBrandingDto? Branding,
    ChannelConfigDto? Config,
    DateTime CreatedAt,
    DateTime UpdatedAt
);