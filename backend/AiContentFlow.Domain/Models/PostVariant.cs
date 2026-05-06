namespace AiContentFlow.Domain.Models;

public class PostVariant
{
    public int Id { get; set; }
    public int ContentPostId { get; set; }
    public ContentPost? ContentPost { get; set; }

    public SocialPlatform Platform { get; set; }
    public string ContentJson { get; set; } = string.Empty;
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<PostPublication> Publications { get; set; } = [];
}