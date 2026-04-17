using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class ContentPostRepository : IContentPostRepository
{
    private readonly AppDbContext _context;

    public ContentPostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ContentPost contentPost)
    {
        await _context.ContentPosts.AddAsync(contentPost);
    }

    public async Task<ContentPost?> GetByIdAsync(Guid teamId, int contentPostId)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .FirstOrDefaultAsync(cp => cp.TeamId == teamId && cp.Id == contentPostId && cp.Status != ContentStatus.Deleted);
    }

    public async Task<List<ContentPost>> GetByTeamAsync(Guid teamId)
    {
        return await _context.ContentPosts
            .Include(cp => cp.PostVariants)
            .Where(cp => cp.TeamId == teamId && cp.Status != ContentStatus.Deleted)
            .OrderByDescending(cp => cp.CreatedAt)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
