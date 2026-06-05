namespace AiContentFlow.Domain.Models;

public class ContentPost
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }

    public int? ChannelId { get; set; }
    public int? CampaignId { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;

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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    //  Navigation Properties
    public Team? Team { get; set; }
    public Channel? Channel { get; set; }
    public Campaign? Campaign { get; set; }
    public ICollection<PostVariant> PostVariants { get; set; } = [];
    public ICollection<PostPublication> Publications { get; set; } = [];
}