using AiContentFlow.Application.Common.Interfaces;
using Hangfire;

namespace AiContentFlow.Infrastructure.Workers;

public class HangfireBrandImportJobScheduler : IBrandImportJobScheduler
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public HangfireBrandImportJobScheduler(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public Task ScheduleAsync(int importJobId, CancellationToken cancellationToken = default)
    {
        _backgroundJobClient.Schedule<BrandImportWorker>(
            worker => worker.ExecuteAsync(importJobId),
            TimeSpan.FromSeconds(2));

        return Task.CompletedTask;
    }
}
