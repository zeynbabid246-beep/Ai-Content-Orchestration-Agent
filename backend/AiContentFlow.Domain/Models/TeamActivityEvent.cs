namespace AiContentFlow.Domain.Models;

public class TeamActivityEvent
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public string ActorUserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; }
}
