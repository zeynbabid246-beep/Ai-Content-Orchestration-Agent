namespace AiContentFlow.Application.Common.Interfaces;

public interface IBrandImportProcessor
{
    Task ProcessAsync(int importJobId, CancellationToken cancellationToken = default);
}
