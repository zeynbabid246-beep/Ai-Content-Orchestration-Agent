using AiContentFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AiContentFlow.Domain.Models;

namespace AiContentFlow.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Identity.RefreshToken> RefreshTokens { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<UserTeam> UserTeams { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // RefreshToken configuration
        builder.Entity<Identity.RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId);

        // Team configuration
        builder.Entity<Team>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
        });

        // UserTeam configuration - FIXED
       builder.Entity<UserTeam>(entity =>
{
    entity.HasKey(ut => ut.Id);
    entity.HasIndex(ut => new { ut.UserId, ut.TeamId }).IsUnique();
    
    // No User navigation property, just FK constraint
    entity.Property(ut => ut.UserId).IsRequired();
    
    entity.HasOne(ut => ut.Team)
          .WithMany(t => t.UserTeams)
          .HasForeignKey(ut => ut.TeamId)
          .OnDelete(DeleteBehavior.Cascade);
});
    }
}