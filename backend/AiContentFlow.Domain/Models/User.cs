using System.Collections.Generic;

namespace AiContentFlow.Domain.Models;

public class User
{
    public string? Id {get;set;}
    public required string Username {get;set;}
    public required string PasswordHash {get;set;}
public ICollection<UserTeam> UserTeams { get; set; }=[];
}