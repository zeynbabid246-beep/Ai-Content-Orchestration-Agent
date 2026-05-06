using AiContentFlow.Application.Common.Models;

namespace Application.Interfaces
{
    public interface ISocialAuthService
    {
        string GetAuthUrl(string state);
        Task<SocialAuthResult> ProcessCallbackAsync(string code, string state);
    }
}
