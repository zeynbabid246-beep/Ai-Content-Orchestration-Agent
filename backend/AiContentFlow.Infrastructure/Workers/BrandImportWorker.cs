using AiContentFlow.Application.Common.Interfaces;
using Hangfire;

namespace AiContentFlow.Infrastructure.Workers;

public class BrandImportWorker
{
    private readonly IBrandImportProcessor _brandImportProcessor;

    public BrandImportWorker(IBrandImportProcessor brandImportProcessor)
    {
        _brandImportProcessor = brandImportProcessor;
    }

    [AutomaticRetry(Attempts = 0, OnAttemptsExceeded = AttemptsExceededAction.Delete)]
    public Task ExecuteAsync(int importJobId)
    {
        return _brandImportProcessor.ProcessAsync(importJobId);
    }
}
