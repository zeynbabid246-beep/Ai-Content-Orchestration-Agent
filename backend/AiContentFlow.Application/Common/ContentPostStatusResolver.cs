using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common;

public static class ContentPostStatusResolver
{
    public static ContentStatus Resolve(ContentStatus storedStatus, IEnumerable<PostPublication> publications)
    {
        if (storedStatus == ContentStatus.Deleted)
            return ContentStatus.Deleted;

        if (publications.Any(p => p.Status == PublicationStatus.Published))
            return ContentStatus.Published;

        if (publications.Any(p => p.Status is PublicationStatus.Scheduled or PublicationStatus.Queued))
            return ContentStatus.Scheduled;

        return storedStatus;
    }

    public static ContentStatus Resolve(
        ContentStatus storedStatus,
        DateTime? scheduledAt,
        DateTime? publishedAt)
    {
        if (storedStatus == ContentStatus.Deleted)
            return ContentStatus.Deleted;

        if (publishedAt.HasValue)
            return ContentStatus.Published;

        if (scheduledAt.HasValue)
            return ContentStatus.Scheduled;

        return storedStatus;
    }
}
