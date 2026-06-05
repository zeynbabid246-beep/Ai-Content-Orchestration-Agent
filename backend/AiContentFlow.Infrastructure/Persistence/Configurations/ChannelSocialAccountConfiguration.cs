using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiContentFlow.Infrastructure.Persistence.Configurations;

public class ChannelSocialAccountConfiguration : IEntityTypeConfiguration<ChannelSocialAccount>
{
    public void Configure(EntityTypeBuilder<ChannelSocialAccount> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.HasIndex(x => new { x.ChannelId, x.SocialAccountId }).IsUnique();
        builder.HasIndex(x => x.ChannelId);
        builder.HasIndex(x => x.SocialAccountId);

        builder.HasOne(x => x.Channel)
            .WithMany(c => c.SocialAccountLinks)
            .HasForeignKey(x => x.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.SocialAccount)
            .WithMany(sa => sa.ChannelLinks)
            .HasForeignKey(x => x.SocialAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(x => !x.Channel!.IsDeleted && !x.SocialAccount!.IsDeleted);
    }
}
