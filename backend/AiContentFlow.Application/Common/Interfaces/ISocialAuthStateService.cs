using AiContentFlow.Application.Common.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ISocialAuthStateService
{
    string CreateState(Guid teamId, int channelId, string userId, string platform, DateTime utcNow);
    SocialAuthState ValidateState(string state, string platform, string userId, DateTime utcNow);
}
