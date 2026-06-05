namespace AiContentFlow.Application.Features.Teams.Dtos;

public record TeamActivityEventDto(
    Guid Id,
    string ActorUserId,
    string Action,
    string? EntityType,
    string? EntityId,
    string? MetadataJson,
    DateTime CreatedAt);
