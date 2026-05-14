namespace AiContentFlow.Domain.Models;

public class TeamBrandStudio
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }

    public string? WebsiteUrl { get; set; }
    public string? CompanyName { get; set; }
    public string? Description { get; set; }
    public string? Mission { get; set; }
    public string? TargetAudience { get; set; }
    public string KeywordsJson { get; set; } = "[]";
    public string? ToneOfVoice { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<BrandImportJob> ImportJobs { get; set; } = [];
}
