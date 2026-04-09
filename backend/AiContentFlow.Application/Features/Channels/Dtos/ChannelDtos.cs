namespace AiContentFlow.Application.Features.Channels.Dtos;

public record CreateChannelDto(
    string Name,
    string? Description
);

public record UpdateChannelDto(
    string Name,
    string? Description
);

public record ChannelResponseDto(
    int Id,
    Guid TeamId,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt
);