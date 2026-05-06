public interface ILinkedInAuthService
{
    string GetLoginUrl(string state);
    Task<AiContentFlow.Application.Common.Models.SocialAuthResult> HandleCallbackAsync(string code, string state);
}
