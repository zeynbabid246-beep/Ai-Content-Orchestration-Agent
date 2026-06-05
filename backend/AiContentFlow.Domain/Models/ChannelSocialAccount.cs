namespace AiContentFlow.Domain.Models;

public class ChannelSocialAccount
{
    public int Id { get; set; }
    public int ChannelId { get; set; }
    public Channel? Channel { get; set; }
    public int SocialAccountId { get; set; }
    public SocialAccount? SocialAccount { get; set; }
    public DateTime CreatedAt { get; set; }
}
