using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public class PostVariantRepository : IPostVariantRepository
{
    private readonly AppDbContext _context;

    public PostVariantRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PostVariant?> GetByIdAsync(Guid teamId, int id)
        => await _context.PostVariants
            .Include(v => v.ContentPost)
            .FirstOrDefaultAsync(v => v.Id == id && v.ContentPost != null && v.ContentPost.TeamId == teamId);

    public async Task<List<PostVariant>> GetByContentPostIdAsync(Guid teamId, int contentPostId)
        => await _context.PostVariants
            .Include(v => v.ContentPost)
            .Where(v => v.ContentPostId == contentPostId
                        && v.ContentPost != null
                        && v.ContentPost.TeamId == teamId)
            .ToListAsync();

    public async Task AddAsync(PostVariant variant)
        => await _context.PostVariants.AddAsync(variant);

    public async Task UpdateAsync(PostVariant variant)
        => _context.PostVariants.Update(variant);

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
}