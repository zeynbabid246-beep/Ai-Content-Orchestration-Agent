namespace AiContentFlow.Domain.Models;

public class SocialAccount
{
    public int Id { get; set; }
    public Guid TeamId { get; set; }
    public string AccountName { get; set; } = "";
    public Team? Team { get; set; }
    public int ChannelId { get; set; }
    public Channel? Channel { get; set; }
    public SocialPlatform Platform { get; set; }
    public SocialAccountStatus Status { get; set; }
    public string AccountHandle { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
        public bool IsActive { get; set; }
        public string OAuthToken { get; set; } = "";
 public string PlatformAccountId { get; set; } = ""; 
 public string? RefreshToken { get; set; }

    public DateTime TokenExpiry { get; set; }
}
