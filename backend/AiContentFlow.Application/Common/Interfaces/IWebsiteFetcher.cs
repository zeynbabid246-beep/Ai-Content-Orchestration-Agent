namespace AiContentFlow.Application.Common.Interfaces;

public interface IWebsiteFetcher
{
    Task<string> FetchHtmlAsync(string websiteUrl, CancellationToken cancellationToken = default);
}
