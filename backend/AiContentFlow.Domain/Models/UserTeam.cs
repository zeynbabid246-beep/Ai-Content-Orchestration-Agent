namespace AiContentFlow.Domain.Models;

public enum TeamRole { Viewer = 0, Admin = 1, Editor = 2 }

public class UserTeam
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public required TeamRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
}