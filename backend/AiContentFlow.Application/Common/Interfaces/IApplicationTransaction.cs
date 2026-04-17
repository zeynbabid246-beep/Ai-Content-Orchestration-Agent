namespace AiContentFlow.Application.Common.Interfaces;

public interface IApplicationTransaction
{
    Task ExecuteAsync(Func<Task> action);
}
