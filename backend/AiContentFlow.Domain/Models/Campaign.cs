namespace AiContentFlow.Domain.Models;

public class Campaign
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CampaignStatus Status { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CampaignContentPost> CampaignContentPosts { get; set; } = [];
}
