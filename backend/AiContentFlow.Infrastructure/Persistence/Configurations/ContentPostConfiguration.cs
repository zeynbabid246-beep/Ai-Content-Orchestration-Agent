using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiContentFlow.Infrastructure.Persistence.Configurations;

public class ContentPostConfiguration : IEntityTypeConfiguration<ContentPost>
{
    public void Configure(EntityTypeBuilder<ContentPost> builder)
    {
        builder.HasKey(cp => cp.Id);

        builder.Property(cp => cp.Topic).IsRequired().HasMaxLength(300);
        builder.Property(cp => cp.Title).HasMaxLength(300);
        builder.Property(cp => cp.Subject).HasMaxLength(300);
        builder.Property(cp => cp.Content).HasColumnType("text");
        builder.Property(cp => cp.ContentJson).IsRequired().HasColumnType("jsonb");
        builder.Property(cp => cp.ContentType).HasConversion<int>();
        builder.Property(cp => cp.Status).HasConversion<int>();
        builder.Property(cp => cp.Prompt).HasColumnType("text");
        builder.Property(cp => cp.AiModel).HasMaxLength(100);
        builder.Property(cp => cp.CreatedByUserId).IsRequired();
        builder.Property(cp => cp.CreatedAt).IsRequired();
        builder.Property(cp => cp.UpdatedAt).IsRequired();

        // Indexes
        builder.HasIndex(cp => new { cp.TeamId, cp.CreatedAt });
        builder.HasIndex(cp => new { cp.TeamId, cp.ChannelId });
        builder.HasIndex(cp => new { cp.TeamId, cp.Status });

        // Relationships
        builder.HasOne(cp => cp.Team)
              .WithMany(t => t.ContentPosts)
              .HasForeignKey(cp => cp.TeamId)
              .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(cp => cp.PostVariants)
              .WithOne(pv => pv.ContentPost)
              .HasForeignKey(pv => pv.ContentPostId)
              .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cp => cp.Channel)
              .WithMany(c => c.ContentPosts)
              .HasForeignKey(cp => cp.ChannelId)
              .IsRequired()
              .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cp => cp.Campaign)
              .WithMany(c => c.ContentPosts)
              .HasForeignKey(cp => cp.CampaignId)
              .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(cp => cp.Publications)
              .WithOne(p => p.ContentPost)
              .HasForeignKey(p => p.ContentPostId)
              .OnDelete(DeleteBehavior.Cascade);
    }
}