namespace Application.Interfaces
{
    public interface IAuthServiceFactory
    {
        ISocialAuthService GetService(string platform);
    }
}