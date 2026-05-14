namespace AiContentFlow.Domain.Models;

public class BrandImportJob
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }

    public int TeamBrandStudioId { get; set; }
    public TeamBrandStudio? TeamBrandStudio { get; set; }

    public BrandImportJobStatus Status { get; set; } = BrandImportJobStatus.Queued;
    public string WebsiteUrl { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Error { get; set; }
    public string? RawSnapshot { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public void MarkProcessing(DateTime utcNow)
    {
        Status = BrandImportJobStatus.Processing;
        StartedAt ??= utcNow;
        Error = null;
    }

    public void MarkCompleted(DateTime utcNow, string rawSnapshot)
    {
        Status = BrandImportJobStatus.Completed;
        CompletedAt = utcNow;
        RawSnapshot = rawSnapshot;
        Error = null;
    }

    public void MarkFailed(string error, DateTime utcNow)
    {
        Status = BrandImportJobStatus.Failed;
        CompletedAt = utcNow;
        Error = error;
    }
}
