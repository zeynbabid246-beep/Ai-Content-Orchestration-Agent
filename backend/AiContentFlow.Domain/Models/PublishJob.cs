using AiContentFlow.Domain.Models;


public class PublishJob
{
    public int Id { get; set; }

    public int PostVariantId { get; set; }
    public PostVariant? PostVariant { get; set; }

    public int SocialAccountId { get; set; }
    public SocialAccount? SocialAccount { get; set; }

    public DateTime ScheduledFor { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public string Status { get; set; } = "Pending";

    public int AttemptCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? ErrorMessage { get; set; }
}