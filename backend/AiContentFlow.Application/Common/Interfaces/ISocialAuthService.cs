namespace Application.Interfaces
{
    public interface ISocialAuthService
    {
        string GetAuthUrl(int channelId);
        Task ProcessCallbackAsync(string code, string state);
    }
}