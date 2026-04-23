using Application.Interfaces;
using AiContentFlow.Domain.Models;

namespace Infrastructure.Factories
{
    public class PublisherFactory : IPublisherFactory
    {
        private readonly IEnumerable<IPublisher> _publishers;

        public PublisherFactory(IEnumerable<IPublisher> publishers)
        {
            _publishers = publishers;
        }

        public IPublisher GetPublisher(SocialPlatform platform)
        {
            return _publishers.FirstOrDefault(p => p.Platform == platform)
                ?? throw new NotSupportedException($"No publisher found for {platform}");
        }
    }
}