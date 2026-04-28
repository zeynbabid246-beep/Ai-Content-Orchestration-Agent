using AiContentFlow.Domain.Models;
using Application.DTOs;
using Application.Interfaces;

namespace AiContentFlow.Infrastructure.Services;

public class FakePublisher : IPublisher
{
    public SocialPlatform Platform => SocialPlatform.LinkedIn;

    public Task<PublishResult> PublishAsync(PostVariant post, SocialAccount account)
    {
        if (post.ContentJson.Contains("fail", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(PublishResult.Failure("fail simulation"));
        }

        var fakeId = "fake-IDDD";
        var fakeUrl = $"https://{account.Platform.ToString().ToLowerInvariant()}.com/post/{fakeId}";
        return Task.FromResult(PublishResult.Success(fakeId, fakeUrl));
    }
}
