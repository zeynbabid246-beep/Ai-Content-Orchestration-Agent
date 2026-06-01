using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence.Repositories;

public class BrandStudioRepository : IBrandStudioRepository
{
    private readonly AppDbContext _context;

    public BrandStudioRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TeamBrandStudio?> GetByTeamAsync(Guid teamId)
    {
        return await _context.TeamBrandStudios
            .Include(studio => studio.ImportJobs)
            .FirstOrDefaultAsync(studio => studio.TeamId == teamId);
    }

    public async Task<BrandImportJob?> GetJobByIdAsync(Guid teamId, int jobId)
    {
        return await _context.BrandImportJobs
            .Include(job => job.TeamBrandStudio)
            .FirstOrDefaultAsync(job => job.TeamId == teamId && job.Id == jobId);
    }

    public async Task<BrandImportJob?> GetJobByIdForProcessingAsync(int jobId)
    {
        return await _context.BrandImportJobs
            .Include(job => job.TeamBrandStudio)
            .FirstOrDefaultAsync(job => job.Id == jobId);
    }

    public async Task AddBrandStudioAsync(TeamBrandStudio brandStudio)
    {
        await _context.TeamBrandStudios.AddAsync(brandStudio);
    }

    public async Task AddImportJobAsync(BrandImportJob importJob)
    {
        await _context.BrandImportJobs.AddAsync(importJob);
    }

    public async Task<int> FailActiveJobsAsync(Guid teamId, string reason)
    {
        var now = DateTime.UtcNow;
        var activeJobs = await _context.BrandImportJobs
            .Where(job => job.TeamId == teamId
                          && (job.Status == BrandImportJobStatus.Queued || job.Status == BrandImportJobStatus.Processing))
            .ToListAsync();

        foreach (var job in activeJobs)
        {
            job.Status = BrandImportJobStatus.Failed;
            job.CompletedAt = now;
            job.Error = reason;
        }

        return activeJobs.Count;
    }

    public async Task<List<BrandImportJob>> GetRecentJobsAsync(Guid teamId, int take = 20)
    {
        return await _context.BrandImportJobs
            .Where(job => job.TeamId == teamId)
            .OrderByDescending(job => job.CreatedAt)
            .Take(take)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
