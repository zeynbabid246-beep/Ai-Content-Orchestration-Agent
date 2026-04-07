using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AiContentFlow.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<UserTeam> UserTeams { get; set; }
    public DbSet<ContentPost> ContentPosts { get; set; }
    public DbSet<PostVariant> PostVariants { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => rt.Id);
            entity.Property(rt => rt.TokenHash).IsRequired().HasMaxLength(128);
            entity.Property(rt => rt.UserId).IsRequired();
            entity.Property(rt => rt.CreatedAt).IsRequired();
            entity.Property(rt => rt.ExpiresAt).IsRequired();
            entity.HasIndex(rt => rt.TokenHash).IsUnique();
            entity.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Team>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
        });

        builder.Entity<UserTeam>(entity =>
        {
            entity.HasKey(ut => ut.Id);
            entity.HasIndex(ut => new { ut.UserId, ut.TeamId }).IsUnique();
            entity.Property(ut => ut.UserId).IsRequired();

            entity.HasOne(ut => ut.Team)
                  .WithMany(t => t.UserTeams)
                  .HasForeignKey(ut => ut.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<ApplicationUser>()
                  .WithMany(u => u.UserTeams)
                  .HasForeignKey(ut => ut.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ContentPost>(entity =>
        {
            entity.HasKey(cp => cp.Id);
            entity.Property(cp => cp.Title).HasMaxLength(200);
            entity.Property(cp => cp.ContentJson).IsRequired().HasColumnType("jsonb");
            entity.Property(cp => cp.ContentType).HasConversion<int>();
            entity.Property(cp => cp.Status).HasConversion<int>();
            entity.Property(cp => cp.Prompt).HasMaxLength(4000);
            entity.Property(cp => cp.AiModel).HasMaxLength(100);
            entity.Property(cp => cp.PlatformPostId).HasMaxLength(200);
            entity.Property(cp => cp.PlatformPostUrl).HasMaxLength(500);
            entity.Property(cp => cp.LastError).HasMaxLength(4000);
            entity.Property(cp => cp.CreatedByUserId).IsRequired();
            entity.Property(cp => cp.CreatedAt).IsRequired();
            entity.Property(cp => cp.UpdatedAt).IsRequired();
            entity.Property(cp => cp.RetryCount).HasDefaultValue(0);
            entity.HasIndex(cp => new { cp.TeamId, cp.CreatedAt });
            entity.HasIndex(cp => new { cp.ChannelId, cp.SocialAccountId });

            entity.HasOne(cp => cp.Team)
                  .WithMany(t => t.ContentPosts)
                  .HasForeignKey(cp => cp.TeamId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(cp => cp.PostVariants)
                  .WithOne(pv => pv.ContentPost)
                  .HasForeignKey(pv => pv.ContentPostId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PostVariant>(entity =>
        {
            entity.HasKey(pv => pv.Id);
            entity.Property(pv => pv.ContentJson).IsRequired().HasColumnType("jsonb");
            entity.Property(pv => pv.Title).HasMaxLength(200);
            entity.Property(pv => pv.Platform).HasConversion<int>();
            entity.Property(pv => pv.Status).HasConversion<int>();
            entity.Property(pv => pv.PlatformPostId).HasMaxLength(200);
            entity.Property(pv => pv.PlatformPostUrl).HasMaxLength(500);
            entity.Property(pv => pv.LastError).HasMaxLength(4000);
            entity.Property(pv => pv.CreatedAt).IsRequired();
            entity.Property(pv => pv.UpdatedAt).IsRequired();
            entity.Property(pv => pv.RetryCount).HasDefaultValue(0);
            entity.HasIndex(pv => new { pv.ContentPostId, pv.Platform }).IsUnique();
        });
    }
}