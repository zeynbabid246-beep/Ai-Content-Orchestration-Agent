namespace AiContentFlow.Domain.Models;

public class PublicationAnalytics
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public int PostPublicationId { get; set; }
    public PostPublication? PostPublication { get; set; }
    public string Source { get; set; } = string.Empty;
    public string DedupeKey { get; set; } = string.Empty;
    public DateTime WindowStart { get; set; }
    public DateTime WindowEnd { get; set; }
    public DateTime? PlatformCollectedAt { get; set; }
    public string? MetricVersion { get; set; }
    public int Impressions { get; set; }
    public int Clicks { get; set; }
    public int Shares { get; set; }
    public decimal EngagementRate { get; set; }
    public DateTime CollectedAt { get; set; }
}
