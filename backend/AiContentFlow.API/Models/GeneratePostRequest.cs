
using AiContentFlow.Domain.Models;

namespace API.Models;

public class GeneratePostRequest
{
    public string Topic { get; set; } = "";
    public string Title { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Model { get; set; } = "";
    public ContentType Type { get; set; }
    public ContentFormat Format { get; set; }
    public int? ChannelId { get; set; }
    public int? CampaignId { get; set; }
    public int? SocialAccountId { get; set; }
}