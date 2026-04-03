namespace AiContentFlow.Domain.Models;
using System;
public class RefreshToken
{
    public  int Id {get;set;}
    public  string? Token {get;set;}
    public required string UserId {get;set;}
    public  DateTime ExpiryDate {get;set;}
    public  bool IsRevoked {get;set;}=false;
    public  DateTime CreatedAt {get;set;}
    public  DateTime RevokedAt {get;set;}

    public  string? ReplacedByToken {get;set;} 
    public  User? User {get;set;}


}