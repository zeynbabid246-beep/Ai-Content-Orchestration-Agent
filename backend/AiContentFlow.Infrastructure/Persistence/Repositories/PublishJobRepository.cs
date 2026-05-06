using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class PublishJobRepository : IPublishJobRepository
{
    private readonly AppDbContext _context;

    public PublishJobRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(PublishJob job)
    {
        await _context.PublishJobs.AddAsync(job);
    }

    public async Task<List<PublishJob>> ClaimDueAsync(DateTime utcNow, int batchSize, string workerId)
    {
        var dueJobs = await _context.PublishJobs
            .Include(j => j.PostPublication)
            .Where(j => j.Status == PublishJobStatus.Pending
                        && j.ScheduledAt <= utcNow
                        && j.NextAttemptAt <= utcNow)
            .OrderBy(j => j.ScheduledAt)
            .Take(batchSize)
            .ToListAsync();

        foreach (var job in dueJobs)
        {
            job.MarkRunning(workerId, utcNow);
        }

        await _context.SaveChangesAsync();
        return dueJobs;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
