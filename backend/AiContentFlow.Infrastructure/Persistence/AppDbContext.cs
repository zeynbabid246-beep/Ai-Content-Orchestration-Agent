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
    public DbSet<Channel> Channels { get; set; }
    public DbSet<SocialAccount> SocialAccounts { get; set; }
    public DbSet<ContentPost> ContentPosts { get; set; }
    public DbSet<PostVariant> PostVariants { get; set; }
    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<CampaignContentPost> CampaignContentPosts { get; set; }
    // change on model creating to IENTITYTYPECONFIGURATION
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        // This line replaces the manual "builder.Entity<ContentPost>..." block
        // It will automatically find ContentPostConfiguration and any others you add later
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

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

        builder.Entity<Channel>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.Description).HasMaxLength(500);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired();
            entity.Property(c => c.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(c => new { c.TeamId, c.Name }).IsUnique();
            entity.HasIndex(c => new { c.TeamId, c.CreatedAt });

            entity.HasOne(c => c.Team)
                .WithMany(t => t.Channels)
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.SocialAccounts)
                .WithOne(sa => sa.Channel)
                .HasForeignKey(sa => sa.ChannelId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(c => !c.IsDeleted);
        });

        builder.Entity<SocialAccount>(entity =>
        {
            entity.HasKey(sa => sa.Id);
            entity.Property(sa => sa.Platform).HasConversion<int>();
            entity.Property(sa => sa.Status).HasConversion<int>();
            entity.Property(sa => sa.AccountHandle).IsRequired().HasMaxLength(120);
            entity.Property(sa => sa.DisplayName).HasMaxLength(150);
            entity.Property(sa => sa.CreatedAt).IsRequired();
            entity.Property(sa => sa.UpdatedAt).IsRequired();
            entity.Property(sa => sa.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(sa => new { sa.TeamId, sa.ChannelId });
            entity.HasIndex(sa => new { sa.TeamId, sa.Platform });
            entity.HasIndex(sa => new { sa.TeamId, sa.ChannelId, sa.Platform, sa.AccountHandle }).IsUnique();

            entity.HasOne(sa => sa.Team)
                .WithMany(t => t.SocialAccounts)
                .HasForeignKey(sa => sa.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sa => sa.Channel)
                .WithMany(c => c.SocialAccounts)
                .HasForeignKey(sa => sa.ChannelId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(sa => !sa.IsDeleted);
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

        builder.Entity<Campaign>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(150);
            entity.Property(c => c.Description).HasMaxLength(1000);
            entity.Property(c => c.Status).HasConversion<int>();
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired();
            entity.Property(c => c.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(c => new { c.TeamId, c.Status });
            entity.HasIndex(c => new { c.TeamId, c.CreatedAt });
            entity.HasIndex(c => new { c.TeamId, c.Name });

            entity.HasOne(c => c.Team)
                .WithMany(t => t.Campaigns)
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.CampaignContentPosts)
                .WithOne(ccp => ccp.Campaign)
                .HasForeignKey(ccp => ccp.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(c => !c.IsDeleted);
        });

        builder.Entity<CampaignContentPost>(entity =>
        {
            entity.HasKey(ccp => new { ccp.CampaignId, ccp.ContentPostId });
            entity.Property(ccp => ccp.LinkedAt).IsRequired();
            entity.Property(ccp => ccp.LinkedByUserId).IsRequired();
            entity.HasIndex(ccp => ccp.CampaignId);
            entity.HasIndex(ccp => ccp.ContentPostId);

            entity.HasOne(ccp => ccp.Campaign)
                .WithMany(c => c.CampaignContentPosts)
                .HasForeignKey(ccp => ccp.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ccp => ccp.ContentPost)
                .WithMany(cp => cp.CampaignContentPosts)
                .HasForeignKey(ccp => ccp.ContentPostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(ccp => !ccp.Campaign!.IsDeleted);
        });
    }
}