using AiContentFlow.Infrastructure.Services;
using Application.Interfaces;
using Infrastructure.Services;

namespace AiContentFlow.Infrastructure.Factories;

public class AuthServiceFactory : IAuthServiceFactory
{
    private readonly IEnumerable<ISocialAuthService> _services;

    public AuthServiceFactory(IEnumerable<ISocialAuthService> services)
    {
        _services = services;
    }

    public ISocialAuthService GetService(string platform)
    {
        return platform.ToLower() switch
        {
            "linkedin"  => _services.OfType<LinkedInAuthService>().First(),
            "facebook"  => _services.OfType<MetaAuthService>().First(),
            "instagram" => _services.OfType<MetaAuthService>().First(),
            "threads"   => _services.OfType<ThreadsAuthService>().First(),
            _ => throw new NotSupportedException($"Platform '{platform}' is not supported.")
        };
    }
}