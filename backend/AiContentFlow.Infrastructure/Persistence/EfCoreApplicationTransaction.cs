using AiContentFlow.Application.Common.Interfaces;

namespace AiContentFlow.Infrastructure.Persistence;

public class EfCoreApplicationTransaction : IApplicationTransaction
{
    private readonly AppDbContext _dbContext;

    public EfCoreApplicationTransaction(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task ExecuteAsync(Func<Task> action)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        await action();
        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}
