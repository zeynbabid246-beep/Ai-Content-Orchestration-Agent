namespace AiContentFlow.Domain.Models;

public class RefreshToken
{
    public  int Id {get;set;}
    public required string Token {get;set;}
    public required string UserId {get;set;}
    public required DateTime ExpiryDate {get;set;}
    public  bool IsRevoked {get;set;}=false;
    public required DateTime CreatedAt {get;set;}
    public  DateTime RevokedAt {get;set;}

    public  string ReplacedByToken {get;set;} 
    public  User User {get;set;}


}