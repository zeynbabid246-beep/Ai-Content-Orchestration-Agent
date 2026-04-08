namespace AiContentFlow.Domain.Models;

public enum ContentType
{
    BlogPost = 0,
    TwitterThread = 1,
    LinkedInPost = 2,
    InstagramPost = 3,
    FacebookPost = 4
}

public enum ContentStatus
{
    Draft = 0,
    Ready = 1,
    Scheduled = 2,
    Published = 3,
    Deleted = 4
}

public enum SocialPlatform
{
    Facebook = 0,
    LinkedIn = 1,
    Instagram = 2,
    X = 3,
    Threads = 4,
    TikTok = 5
}
