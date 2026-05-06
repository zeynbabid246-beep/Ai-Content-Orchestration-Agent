namespace AiContentFlow.Domain.Models;

public class PostPublication
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }

    public int ContentPostId { get; set; }
    public ContentPost? ContentPost { get; set; }

    public int? PostVariantId { get; set; }
    public PostVariant? PostVariant { get; set; }

    public int SocialAccountId { get; set; }
    public SocialAccount? SocialAccount { get; set; }

    public PublicationStatus Status { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? ExternalPostId { get; set; }
    public string? ExternalPostUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public string? IdempotencyKey { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<PublishJob> PublishJobs { get; set; } = [];
    public ICollection<PublicationAnalytics> Analytics { get; set; } = [];

    public void MarkPublishing(DateTime utcNow)
    {
        Status = PublicationStatus.Publishing;
        UpdatedAt = utcNow;
    }

    public void MarkPublished(string? externalPostId, string? externalPostUrl, DateTime utcNow)
    {
        Status = PublicationStatus.Published;
        PublishedAt = utcNow;
        ExternalPostId = externalPostId;
        ExternalPostUrl = externalPostUrl;
        ErrorMessage = null;
        UpdatedAt = utcNow;
    }

    public void MarkFailed(string? errorMessage, DateTime utcNow)
    {
        Status = PublicationStatus.Failed;
        ErrorMessage = errorMessage;
        RetryCount++;
        UpdatedAt = utcNow;
    }
}
