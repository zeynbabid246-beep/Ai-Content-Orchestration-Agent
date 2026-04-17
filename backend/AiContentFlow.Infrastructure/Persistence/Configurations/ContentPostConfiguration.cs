using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiContentFlow.Infrastructure.Persistence.Configurations;

public class ContentPostConfiguration : IEntityTypeConfiguration<ContentPost>
{
    public void Configure(EntityTypeBuilder<ContentPost> builder)
    {
        builder.HasKey(cp => cp.Id);

        builder.Property(cp => cp.Title).HasMaxLength(200);
        builder.Property(cp => cp.ContentJson).IsRequired().HasColumnType("jsonb");
        builder.Property(cp => cp.ContentType).HasConversion<int>();
        builder.Property(cp => cp.Status).HasConversion<int>();
        builder.Property(cp => cp.Prompt).HasMaxLength(4000);
        builder.Property(cp => cp.AiModel).HasMaxLength(100);
        builder.Property(cp => cp.PlatformPostId).HasMaxLength(200);
        builder.Property(cp => cp.PlatformPostUrl).HasMaxLength(500);
        builder.Property(cp => cp.LastError).HasMaxLength(4000);
        builder.Property(cp => cp.CreatedByUserId).IsRequired();
        builder.Property(cp => cp.CreatedAt).IsRequired();
        builder.Property(cp => cp.UpdatedAt).IsRequired();
        builder.Property(cp => cp.RetryCount).HasDefaultValue(0);

        // Indexes
        builder.HasIndex(cp => new { cp.TeamId, cp.CreatedAt });
        builder.HasIndex(cp => new { cp.TeamId, cp.ChannelId, cp.SocialAccountId });

        // Relationships
        builder.HasOne(cp => cp.Team)
              .WithMany(t => t.ContentPosts)
              .HasForeignKey(cp => cp.TeamId)
              .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(cp => cp.PostVariants)
              .WithOne(pv => pv.ContentPost)
              .HasForeignKey(pv => pv.ContentPostId)
              .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Channel>()
              .WithMany()
              .HasForeignKey(cp => cp.ChannelId)
              .IsRequired(false)
              .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<SocialAccount>()
              .WithMany()
              .HasForeignKey(cp => cp.SocialAccountId)
              .IsRequired(false)
              .OnDelete(DeleteBehavior.Restrict);
    }
}