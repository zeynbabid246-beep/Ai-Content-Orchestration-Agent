using System;

namespace AiContentFlow.Domain.Models;

public class Post
{
    public Guid Id { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
