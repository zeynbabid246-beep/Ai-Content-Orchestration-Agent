public interface ILinkedInAuthService
{
    string GetLoginUrl(int channelId);
    Task HandleCallbackAsync(string code, string state);
}
