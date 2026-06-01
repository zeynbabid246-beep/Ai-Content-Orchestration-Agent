namespace AiContentFlow.Domain.Models;

public class ChannelBranding
{
    public int Id { get; set; }
    public int ChannelId { get; set; }
    public Channel? Channel { get; set; }
    public string? LogoUrl { get; set; }
    public string? Theme { get; set; }
    public string? Slogan { get; set; }
    public string? Tone { get; set; }
    public string? TargetAudience { get; set; }
    public string? KeywordsCsv { get; set; }
    public string? ContentPillarsCsv { get; set; }
    public string? Mission { get; set; }
    public string? BrandSummary { get; set; }
    public string? Goal { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
