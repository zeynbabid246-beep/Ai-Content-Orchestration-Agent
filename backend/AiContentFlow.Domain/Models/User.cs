using System;
using System.Collections.Generic;

namespace AiContentFlow.Domain.Models;

public class User
{
public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
}
