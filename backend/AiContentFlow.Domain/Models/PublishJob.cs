namespace AiContentFlow.Domain.Models;

public class PublishJob
{
    public int Id { get; set; }

    public int PostPublicationId { get; set; }
    public PostPublication? PostPublication { get; set; }

    public DateTime ScheduledAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExecutedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public PublishJobStatus Status { get; set; } = PublishJobStatus.Pending;

    public int RetryCount { get; set; } = 0;
    public int MaxAttempts { get; set; } = 3;
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? LockedAt { get; set; }
    public string? LockedBy { get; set; }
    public DateTime? DeadLetteredAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? LastError { get; set; }

    public void MarkRunning(string workerId, DateTime utcNow)
    {
        Status = PublishJobStatus.Running;
        LockedBy = workerId;
        LockedAt = utcNow;
        ExecutedAt = utcNow;
    }

    public void MarkSucceeded(DateTime utcNow)
    {
        Status = PublishJobStatus.Succeeded;
        CompletedAt = utcNow;
        LastError = null;
    }

    public void MarkFailed(string? errorMessage, DateTime utcNow)
    {
        RetryCount++;
        LastError = errorMessage;

        if (RetryCount >= MaxAttempts)
        {
            Status = PublishJobStatus.DeadLettered;
            DeadLetteredAt = utcNow;
            CompletedAt = utcNow;
            return;
        }

        Status = PublishJobStatus.Pending;
        NextAttemptAt = utcNow.AddMinutes(Math.Pow(2, RetryCount));
        LockedAt = null;
        LockedBy = null;
    }
}