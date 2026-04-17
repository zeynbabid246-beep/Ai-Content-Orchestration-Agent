namespace AiContentFlow.Domain.Models;

public class CampaignContentPost
{
    public int CampaignId { get; set; }
    public Campaign? Campaign { get; set; }
    public int ContentPostId { get; set; }
    public ContentPost? ContentPost { get; set; }
    public DateTime LinkedAt { get; set; }
    public string LinkedByUserId { get; set; } = string.Empty;
}
