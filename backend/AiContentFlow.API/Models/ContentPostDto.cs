namespace API.Models;

public class ContentPostDto
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public int ChannelId { get; set; }
    public int? CampaignId { get; set; }
    public string Topic { get; set; } = "";
    public string Title { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Content { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public string ContentJson { get; set; } = "";
    public string ContentType { get; set; } = "";
    public string Status { get; set; } = "";
    public string AiModel { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}