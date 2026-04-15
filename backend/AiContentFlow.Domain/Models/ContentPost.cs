namespace AiContentFlow.Domain.Models;

public class ContentPost
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public int ChannelId { get; set; }
    public int SocialAccountId { get; set; }
    public string? Title { get; set; }
    public ContentType ContentType { get; set; }
    public string ContentJson { get; set; } = string.Empty;
    public ContentStatus Status { get; set; }
    public string? Prompt { get; set; }
    public string? AiModel { get; set; }
    public int? AiTokens { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? PlatformPostId { get; set; }
    public string? PlatformPostUrl { get; set; }
    public int RetryCount { get; set; }
    public string? LastError { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<PostVariant> PostVariants { get; set; } = [];
    public ICollection<CampaignContentPost> CampaignContentPosts { get; set; } = [];
}
