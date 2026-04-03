using System;
using System.ComponentModel.DataAnnotations;
namespace AiContentFlow.Domain.Models;

public enum TeamRole {Viewer , Editor, Admin,
    Owner
}
public class UserTeam
{
     [Key]   
    public Guid Id { get; set; }
public  string UserId {get;set;}=string.Empty;
public Guid TeamId {get;set;}
public  Team? Team {get;set;}

public TeamRole Role {get;set;}
public DateTime JoinedAt {get;set;
}
}

   
