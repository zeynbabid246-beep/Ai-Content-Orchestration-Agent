namespace AiContentFlow.Domain.Models;

public class ChannelConfig
{
    public int Id { get; set; }
    public int ChannelId { get; set; }
    public Channel? Channel { get; set; }
    public string SettingsJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
