using System;
using Microsoft. EntityFrameworkCore;


namespace AiContentFlow.Infrastructure.Data;
using AiContentFlow.Domain.Models;
public class AppDbContext : DbContext
{
public DbSet<User> Users { get; set; }
public DbSet<RefreshToken> RefreshTokens { get; set; }

public AppDbContext(DbContextOptions<AppDbContext> options)
: base(options) { }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{

modelBuilder. Entity<User>()
.HasIndex(x => x.Username)
.IsUnique();

modelBuilder. Entity<RefreshToken>()
.HasOne(x => x.User)
.WithMany()
.HasForeignKey(x => x.UserId);

}

   
}
