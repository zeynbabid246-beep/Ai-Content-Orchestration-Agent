namespace AiContentFlow.Domain.Models;
public static class AiModelExtensions
{
    public static string ToModelString(this AiModel model) => model switch
    {
        AiModel.Gpt4oMini => "gpt-4o-mini",
        AiModel.Gpt4o => "gpt-4o",
        AiModel.DeepseekR1 => "deepseek-r1",
        AiModel.DeepseekChat => "deepseek-chat",
        AiModel.Gemini2_5Flash => "gemini-2.5-flash",
        AiModel.Gemini2_0Flash => "gemini-2.0-flash",
        AiModel.Gemini => "gemini",
        AiModel.Groq => "groq",
        AiModel.Pollinations => "pollinations",
        _ => throw new NotSupportedException()
    };
}
public enum ContentType
{
    BlogPost,
    TwitterThread,
    LinkedInPost,
    InstagramPost,
    FacebookPost
}

public enum ContentStatus
{
    Draft,
    Ready,
    Scheduled,
    Published,
    Deleted
}

public enum SocialPlatform
{
    Facebook,
    LinkedIn,
    Instagram,
    X,
    Threads,
    TikTok
}

public enum SocialAccountStatus
{
    Active,
    Disconnected
}

public enum CampaignStatus
{
    Active,
    Archived
}

public enum PublicationStatus
{
    Scheduled,
    Queued,
    Publishing,
    Published,
    Failed,
    Retrying,
    Cancelled
}

public enum PublishJobStatus
{
    Pending,
    Running,
    Succeeded,
    Failed,
    DeadLettered
}
public enum AiModel
{
    // OpenAI
    Gpt4oMini,
    Gpt4o,

    // DeepSeek
    DeepseekR1,
    DeepseekChat,

    // Gemini
    Gemini2_5Flash,
    Gemini2_0Flash,
    Gemini,

    // Groq
    Groq,

    // Pollinations
    Pollinations,
}
public enum ContentFormat
{
    Text,
    Image,
    TextImage
}