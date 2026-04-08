using System;

namespace AiContentFlow.Domain.Models;

public class PostVariant
{
    public int Id { get; set; }
    public int ContentPostId { get; set; }
    public ContentPost? ContentPost { get; set; }
    public SocialPlatform Platform { get; set; }
    public string ContentJson { get; set; } = string.Empty;
    public string? Title { get; set; }
    public ContentStatus Status { get; set; }
    public string? PlatformPostId { get; set; }
    public string? PlatformPostUrl { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int RetryCount { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
