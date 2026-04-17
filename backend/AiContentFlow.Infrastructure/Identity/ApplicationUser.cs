using AiContentFlow.Domain.Models;
using Microsoft.AspNetCore.Identity;

namespace AiContentFlow.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
}