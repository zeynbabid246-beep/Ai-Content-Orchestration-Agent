using System;

namespace AiContentFlow.Domain.Models;

public class Team
{
public  Guid Id {get;set;} 
public required string Name {get;set;}
public required DateTime CreatedAt {get;set;}
public ICollection<UserTeam> UserTeams {get;set;}=[];
// public ICollection<Channel> Channels {get;set;}=[];
//public ICollection<Lead> Leads {get;set;}=[];
}
