using System.Net;

namespace AiContentFlow.Infrastructure.Publishers;

internal static class PublishLocalImageHelper
{
    public static bool TryResolveLocalPath(string imageUrl, out string localPath)
    {
        localPath = string.Empty;
        if (string.IsNullOrWhiteSpace(imageUrl))
            return false;

        string? requestPath = null;

        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
        {
            var isLocalHost = uri.IsLoopback
                              || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                              || uri.Host.Equals("127.0.0.1")
                              || uri.Host.Equals("::1");

            if (!isLocalHost)
                return false;

            requestPath = WebUtility.UrlDecode(uri.AbsolutePath);
        }
        else if (imageUrl.StartsWith('/'))
        {
            requestPath = WebUtility.UrlDecode(imageUrl);
        }

        if (string.IsNullOrWhiteSpace(requestPath))
            return false;

        var trimmedPath = requestPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.GetFullPath(Path.Combine(wwwroot, trimmedPath));
        var fullWwwroot = Path.GetFullPath(wwwroot);

        if (!fullPath.StartsWith(fullWwwroot, StringComparison.OrdinalIgnoreCase))
            return false;

        localPath = fullPath;
        return File.Exists(localPath);
    }

    public static string? TryRewriteToPublicBaseUrl(string imageUrl, string? publicMediaBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(publicMediaBaseUrl)
            || string.IsNullOrWhiteSpace(imageUrl)
            || !Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
        {
            return null;
        }

        var isLocalHost = uri.IsLoopback
                          || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                          || uri.Host.Equals("127.0.0.1")
                          || uri.Host.Equals("::1");

        if (!isLocalHost)
            return null;

        var baseUri = publicMediaBaseUrl.TrimEnd('/');
        return $"{baseUri}{uri.AbsolutePath}{uri.Query}";
    }
}
