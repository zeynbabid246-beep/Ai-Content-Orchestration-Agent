using AiContentFlow.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AiContentFlow.Infrastructure.Persistence.Configurations;

public class TeamActivityEventConfiguration : IEntityTypeConfiguration<TeamActivityEvent>
{
    public void Configure(EntityTypeBuilder<TeamActivityEvent> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ActorUserId).IsRequired();
        builder.Property(e => e.Action).IsRequired().HasMaxLength(100);
        builder.Property(e => e.EntityType).HasMaxLength(100);
        builder.Property(e => e.EntityId).HasMaxLength(100);
        builder.HasIndex(e => new { e.TeamId, e.CreatedAt });
    }
}
