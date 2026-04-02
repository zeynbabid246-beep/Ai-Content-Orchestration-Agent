using System;

namespace AiContentFlow.Domain.Models;

public enum TeamRole {Viewer , Editor, Admin}
public class UserTeam
{
public Guid  UserId {get;set;}
public Guid TeamId {get;set;}
public required TeamRole Role {get;set;}
public required DateTime JoinedAt {get;set;}

}
