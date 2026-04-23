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

    public async Task<PostVariant?> GetByIdAsync(int id)
        => await _context.PostVariants.FindAsync(id);

    public async Task<List<PostVariant>> GetByContentPostIdAsync(int contentPostId)
        => await _context.PostVariants
            .Where(v => v.ContentPostId == contentPostId)
            .ToListAsync();

    public async Task AddAsync(PostVariant variant)
        => await _context.PostVariants.AddAsync(variant);

    public async Task UpdateAsync(PostVariant variant)
        => _context.PostVariants.Update(variant);

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
}