using AiContentFlow.Domain.Models;
using AiContentFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

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
    public DbSet<ChannelBranding> ChannelBrandings { get; set; }
    public DbSet<ChannelConfig> ChannelConfigs { get; set; }
    public DbSet<PostPublication> PostPublications { get; set; }
    public DbSet<PublishJob> PublishJobs { get; set; }
    public DbSet<PublicationAnalytics> PublicationAnalytics { get; set; }
    public DbSet<TeamBrandStudio> TeamBrandStudios { get; set; }
    public DbSet<BrandImportJob> BrandImportJobs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
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
            entity.Property(t => t.IsNameSetupRequired).HasDefaultValue(false);
        });

        builder.Entity<TeamBrandStudio>(entity =>
        {
            entity.HasKey(studio => studio.Id);
            entity.Property(studio => studio.OrgId).HasMaxLength(120);
            entity.Property(studio => studio.WebsiteUrl).HasMaxLength(500);
            entity.Property(studio => studio.BrandName).HasMaxLength(200);
            entity.Property(studio => studio.BrandSummary).HasMaxLength(2000);
            entity.Property(studio => studio.Slogan).HasMaxLength(300);
            entity.Property(studio => studio.BusinessInfo).HasMaxLength(4000);
            entity.Property(studio => studio.Email).HasMaxLength(320);
            entity.Property(studio => studio.VisualLogoUrl).HasMaxLength(1000);
            entity.Property(studio => studio.VisualFaviconUrl).HasMaxLength(1000);
            entity.Property(studio => studio.VisualStyle).HasMaxLength(500);
            entity.Property(studio => studio.VisualHeroText).HasMaxLength(300);
            entity.Property(studio => studio.VisualScreenshotPath).HasMaxLength(500);
            entity.Property(studio => studio.VisualRenderMode).HasMaxLength(50);
            entity.Property(studio => studio.EnrichedBrandArchetype).HasMaxLength(200);
            entity.Property(studio => studio.EnrichedPositioningStatement).HasMaxLength(2000);
            entity.Property(studio => studio.EnrichedVisualDirectionNotes).HasMaxLength(2000);
            entity.Property(studio => studio.EnrichedLinkedInVoice).HasMaxLength(2000);
            entity.Property(studio => studio.EnrichedAdCopyStyle).HasMaxLength(2000);
            entity.Property(studio => studio.DefaultToneOfVoice).HasMaxLength(500);
            entity.Property(studio => studio.DefaultTargetAudience).HasMaxLength(1000);
            entity.Property(studio => studio.DefaultMission).HasMaxLength(1000);
            entity.Property(studio => studio.DefaultBrandSummary).HasMaxLength(2000);
            entity.Property(studio => studio.DefaultCampaignObjective).HasMaxLength(120);
            entity.Property(studio => studio.CreatedAt).IsRequired();
            entity.Property(studio => studio.UpdatedAt).IsRequired();
            entity.HasIndex(studio => studio.TeamId).IsUnique();

            ConfigureStringList(entity, studio => studio.ValueProposition);
            ConfigureStringList(entity, studio => studio.ToneOfVoice);
            ConfigureStringList(entity, studio => studio.AudienceSignals);
            ConfigureStringList(entity, studio => studio.ContentPillars);
            ConfigureStringList(entity, studio => studio.KeyMessages);
            ConfigureStringList(entity, studio => studio.VisualPrimaryColors);
            ConfigureStringList(entity, studio => studio.VisualSecondaryColors);
            ConfigureStringList(entity, studio => studio.VisualFontFamilies);
            ConfigureStringList(entity, studio => studio.VisualImageUrls);
            ConfigureStringList(entity, studio => studio.VisualCtaTexts);
            ConfigureStringList(entity, studio => studio.EnrichedBrandPersonality);
            ConfigureStringList(entity, studio => studio.VoiceGuidelinesDo);
            ConfigureStringList(entity, studio => studio.VoiceGuidelinesDont);
            ConfigureStringList(entity, studio => studio.EnrichedMessagingPriorities);
            ConfigureStringList(entity, studio => studio.DefaultContentPillars);

            entity.HasOne(studio => studio.Team)
                .WithOne(team => team.BrandStudio)
                .HasForeignKey<TeamBrandStudio>(studio => studio.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<BrandImportJob>(entity =>
        {
            entity.HasKey(job => job.Id);
            entity.Property(job => job.Status).HasConversion<int>();
            entity.Property(job => job.WebsiteUrl).IsRequired().HasMaxLength(500);
            entity.Property(job => job.Error).HasMaxLength(4000);
            entity.Property(job => job.RawSnapshot).HasColumnType("jsonb");
            entity.Property(job => job.CreatedAt).IsRequired();
            entity.HasIndex(job => new { job.TeamId, job.Status });
            entity.HasIndex(job => new { job.TeamId, job.CreatedAt });

            entity.HasOne(job => job.TeamBrandStudio)
                .WithMany(studio => studio.ImportJobs)
                .HasForeignKey(job => job.TeamBrandStudioId)
                .OnDelete(DeleteBehavior.Cascade);
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
            entity.Property(c => c.NormalizedName).IsRequired().HasMaxLength(100);
            entity.Property(c => c.Description).HasMaxLength(500);
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired();
            entity.Property(c => c.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(c => new { c.TeamId, c.NormalizedName }).IsUnique();
            entity.HasIndex(c => new { c.TeamId, c.CreatedAt });

            entity.HasOne(c => c.Team)
                .WithMany(t => t.Channels)
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(c => c.SocialAccounts)
                .WithOne(sa => sa.Channel)
                .HasForeignKey(sa => sa.ChannelId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.Campaigns)
                .WithOne(campaign => campaign.Channel)
                .HasForeignKey(campaign => campaign.ChannelId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.ContentPosts)
                .WithOne(cp => cp.Channel)
                .HasForeignKey(cp => cp.ChannelId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.Branding)
                .WithOne(b => b.Channel)
                .HasForeignKey<ChannelBranding>(b => b.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Config)
                .WithOne(config => config.Channel)
                .HasForeignKey<ChannelConfig>(config => config.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

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
            entity.Property(sa => sa.OAuthToken).IsRequired().HasMaxLength(2000);
            entity.Property(sa => sa.ExternalAccountId).IsRequired().HasMaxLength(200);
            entity.Property(sa => sa.RefreshToken).HasMaxLength(2000);
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

        builder.Entity<ChannelBranding>(entity =>
        {
            entity.HasKey(cb => cb.Id);
            entity.Property(cb => cb.LogoUrl).HasMaxLength(1000);
            entity.Property(cb => cb.Theme).HasMaxLength(100);
            entity.Property(cb => cb.Slogan).HasMaxLength(300);
            entity.Property(cb => cb.Tone).HasMaxLength(300);
            entity.Property(cb => cb.TargetAudience).HasMaxLength(1000);
            entity.Property(cb => cb.KeywordsCsv).HasMaxLength(4000);
            entity.Property(cb => cb.ContentPillarsCsv).HasMaxLength(4000);
            entity.Property(cb => cb.Mission).HasMaxLength(1000);
            entity.Property(cb => cb.BrandSummary).HasMaxLength(2000);
            entity.Property(cb => cb.Goal).HasMaxLength(120);
            entity.Property(cb => cb.CreatedAt).IsRequired();
            entity.Property(cb => cb.UpdatedAt).IsRequired();
        });

        builder.Entity<PostVariant>(entity =>
        {
            entity.HasKey(pv => pv.Id);
            entity.Property(pv => pv.ContentJson).IsRequired().HasColumnType("jsonb");
            entity.Property(pv => pv.Title).HasMaxLength(200);
            entity.Property(pv => pv.Platform).HasConversion<int>();
            entity.Property(pv => pv.CreatedAt).IsRequired();
            entity.Property(pv => pv.UpdatedAt).IsRequired();
            entity.HasIndex(pv => new { pv.ContentPostId, pv.Platform }).IsUnique();
        });

        builder.Entity<Campaign>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(150);
            entity.Property(c => c.Description).HasMaxLength(1000);
            entity.Property(c => c.Objective).HasMaxLength(120);
            entity.Property(c => c.ToneOfVoiceOverride).HasMaxLength(300);
            entity.Property(c => c.TargetAudienceOverride).HasMaxLength(1000);
            entity.Property(c => c.Status).HasConversion<int>();
            entity.Property(c => c.CreatedAt).IsRequired();
            entity.Property(c => c.UpdatedAt).IsRequired();
            entity.Property(c => c.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(c => new { c.TeamId, c.Status });
            entity.HasIndex(c => new { c.TeamId, c.CreatedAt });
            entity.HasIndex(c => new { c.TeamId, c.ChannelId });
            entity.HasIndex(c => new { c.TeamId, c.Name });

            entity.HasOne(c => c.Team)
                .WithMany(t => t.Campaigns)
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Channel)
                .WithMany(channel => channel.Campaigns)
                .HasForeignKey(c => c.ChannelId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(c => !c.IsDeleted);
        });

        builder.Entity<PostPublication>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Status).HasConversion<int>();
            entity.Property(p => p.ExternalPostId).HasMaxLength(200);
            entity.Property(p => p.ExternalPostUrl).HasMaxLength(500);
            entity.Property(p => p.ErrorMessage).HasMaxLength(4000);
            entity.Property(p => p.IdempotencyKey).HasMaxLength(200);
            entity.Property(p => p.CreatedAt).IsRequired();
            entity.Property(p => p.UpdatedAt).IsRequired();
            entity.Property(p => p.RetryCount).HasDefaultValue(0);
            entity.HasIndex(p => new { p.TeamId, p.Status });
            entity.HasIndex(p => new { p.TeamId, p.ScheduledAt });
            entity.HasIndex(p => new { p.TeamId, p.IdempotencyKey }).IsUnique();

            entity.HasOne(p => p.Team)
                .WithMany(t => t.Publications)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.ContentPost)
                .WithMany(cp => cp.Publications)
                .HasForeignKey(p => p.ContentPostId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.PostVariant)
                .WithMany(v => v.Publications)
                .HasForeignKey(p => p.PostVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.SocialAccount)
                .WithMany(sa => sa.Publications)
                .HasForeignKey(p => p.SocialAccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PublishJob>(entity =>
        {
            entity.HasKey(pj => pj.Id);
            entity.Property(pj => pj.Status).HasConversion<int>();
            entity.Property(pj => pj.LastError).HasMaxLength(4000);
            entity.Property(pj => pj.ScheduledAt).IsRequired();
            entity.Property(pj => pj.NextAttemptAt).IsRequired();
            entity.Property(pj => pj.LockedBy).HasMaxLength(200);
            entity.Property(pj => pj.CreatedAt).IsRequired();
            entity.Property(pj => pj.RetryCount).HasDefaultValue(0);
            entity.Property(pj => pj.MaxAttempts).HasDefaultValue(3);
            entity.HasIndex(pj => pj.Status);
            entity.HasIndex(pj => new { pj.Status, pj.ScheduledAt, pj.NextAttemptAt });

            entity.HasOne(pj => pj.PostPublication)
                .WithMany(pp => pp.PublishJobs)
                .HasForeignKey(pj => pj.PostPublicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PublicationAnalytics>(entity =>
        {
            entity.HasKey(pa => pa.Id);
            entity.Property(pa => pa.Source).IsRequired().HasMaxLength(100);
            entity.Property(pa => pa.DedupeKey).IsRequired().HasMaxLength(200);
            entity.Property(pa => pa.MetricVersion).HasMaxLength(100);
            entity.Property(pa => pa.EngagementRate).HasPrecision(8, 4);
            entity.Property(pa => pa.CollectedAt).IsRequired();
            entity.HasIndex(pa => new { pa.TeamId, pa.PostPublicationId, pa.CollectedAt });
            entity.HasIndex(pa => new { pa.TeamId, pa.DedupeKey }).IsUnique();

            entity.HasOne(pa => pa.PostPublication)
                .WithMany(pp => pp.Analytics)
                .HasForeignKey(pa => pa.PostPublicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureStringList<TEntity>(
        EntityTypeBuilder<TEntity> entity,
        System.Linq.Expressions.Expression<Func<TEntity, List<string>>> navigationExpression)
        where TEntity : class
    {
        entity.Property(navigationExpression).HasColumnType("text[]");
    }
}