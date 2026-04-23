namespace AiContentFlow.Domain.Models;

public class ContentPost
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }

    //  Foreign Keys
    public int? ChannelId { get; set; }
    public int? SocialAccountId { get; set; }
    public int? CampaignId { get; set; }

    // 📝 Content Fields
    public string Topic { get; set; } = "";
    public string? Title { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Content { get; set; } = "";
    public string? ImageUrl { get; set; }
    public string ContentJson { get; set; } = string.Empty;
    public string? Prompt { get; set; }
    public string? AiModel { get; set; }
    public int? AiTokens { get; set; }

    // Classification
    public ContentType ContentType { get; set; }
    public ContentStatus Status { get; set; }

    //  Dates
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // 🚀 Publish Tracking
    public string? PlatformPostId { get; set; }
    public string? PlatformPostUrl { get; set; }
    public int RetryCount { get; set; }
    public string? LastError { get; set; }

    //  Audit
    public string CreatedByUserId { get; set; } = string.Empty;

    //  Navigation Properties
    public Team? Team { get; set; }
    public ICollection<PostVariant> PostVariants { get; set; } = [];
    public ICollection<CampaignContentPost> CampaignContentPosts { get; set; } = [];
}