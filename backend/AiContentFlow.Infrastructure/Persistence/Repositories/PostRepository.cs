using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Repositories;

public class PostRepository : IPostRepository
{
    private readonly AppDbContext _context;

    public PostRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Post post)
    {
        await _context.Posts.AddAsync(post);
    }

    public async Task<Post?> GetByIdAsync(Guid teamId, Guid postId)
    {
        return await _context.Posts
            .FirstOrDefaultAsync(p => p.TeamId == teamId && p.Id == postId);
    }

    public async Task<List<Post>> GetByTeamAsync(Guid teamId)
    {
        return await _context.Posts
            .Where(p => p.TeamId == teamId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public Task RemoveAsync(Post post)
    {
        _context.Posts.Remove(post);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
