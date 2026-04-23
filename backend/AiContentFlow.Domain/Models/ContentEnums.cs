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
    Deleted = 4,
     Failed = 5
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

public enum SocialAccountStatus
{
    Active = 0,
    Disconnected = 1
}

public enum CampaignStatus
{
    Draft = 0,
    Active = 1,
    Paused = 2,
    Completed = 3,
    Archived = 4
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
    Text = 0,
    Image = 1,
    TextImage = 2
}