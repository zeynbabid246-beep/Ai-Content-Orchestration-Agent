namespace AiContentFlow.Application.Common.Interfaces;

public interface IBrandImportJobScheduler
{
    Task ScheduleAsync(int importJobId, CancellationToken cancellationToken = default);
}
