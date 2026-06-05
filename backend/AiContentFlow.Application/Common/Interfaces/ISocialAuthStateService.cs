using AiContentFlow.Application.Common.Models;

namespace AiContentFlow.Application.Common.Interfaces;

public interface ISocialAuthStateService
{
    string CreateState(Guid teamId, int? linkChannelId, string userId, string platform, DateTime utcNow);
    SocialAuthState ValidateState(string state, string platform, DateTime utcNow, string? expectedUserId = null);
}
