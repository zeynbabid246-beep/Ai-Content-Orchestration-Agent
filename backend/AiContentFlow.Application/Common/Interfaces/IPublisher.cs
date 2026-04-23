using AiContentFlow.Domain.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    public interface IPublisher
    {
        SocialPlatform Platform { get; }
        Task<PublishResult> PublishAsync(PostVariant post, SocialAccount account);
    }
}