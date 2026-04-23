using AiContentFlow.Domain;
using AiContentFlow.Domain.Models;

namespace Application.Interfaces
{
    public interface IPublisherFactory
    {
        IPublisher GetPublisher(SocialPlatform platform);
    }
}