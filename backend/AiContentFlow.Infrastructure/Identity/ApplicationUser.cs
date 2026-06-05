using AiContentFlow.Domain.Models;
using Microsoft.AspNetCore.Identity;

namespace AiContentFlow.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
}