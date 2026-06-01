using System.Net;
using System.Net.Sockets;
using AiContentFlow.Application.Common.Interfaces;

namespace AiContentFlow.Infrastructure.BrandStudio;

public class SafeWebsiteFetcher : IWebsiteFetcher
{
    private const int MaxBytes = 512 * 1024;
    private const int MaxRedirects = 3;
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(20);

    private readonly HttpClient _httpClient;

    public SafeWebsiteFetcher(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient(nameof(SafeWebsiteFetcher));
        _httpClient.Timeout = Timeout;
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("AiContentFlow-BrandBot/1.0");
    }

    public async Task<string> FetchHtmlAsync(string websiteUrl, CancellationToken cancellationToken = default)
    {
        var uri = ValidateUrl(websiteUrl);
        var current = uri;

        for (var redirect = 0; redirect <= MaxRedirects; redirect++)
        {
            await EnsureSafeHostAsync(current, cancellationToken);

            using var request = new HttpRequestMessage(HttpMethod.Get, current);
            using var response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (IsRedirect(response.StatusCode))
            {
                var location = response.Headers.Location;
                if (location is null)
                    throw new InvalidOperationException("Redirect response missing location header.");

                current = location.IsAbsoluteUri ? location : new Uri(current, location);
                ValidateUrl(current.ToString());
                continue;
            }

            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);
            var buffer = new char[MaxBytes];
            var read = await reader.ReadAsync(buffer, cancellationToken);
            return new string(buffer, 0, read);
        }

        throw new InvalidOperationException("Too many redirects while fetching website.");
    }

    private static Uri ValidateUrl(string websiteUrl)
    {
        if (!Uri.TryCreate(websiteUrl.Trim(), UriKind.Absolute, out var uri))
            throw new InvalidOperationException("Website URL is invalid.");

        if (!uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only HTTPS website URLs are allowed.");

        if (string.IsNullOrWhiteSpace(uri.Host))
            throw new InvalidOperationException("Website URL host is required.");

        return uri;
    }

    private static async Task EnsureSafeHostAsync(Uri uri, CancellationToken cancellationToken)
    {
        var addresses = await Dns.GetHostAddressesAsync(uri.DnsSafeHost, cancellationToken);
        if (addresses.Length == 0)
            throw new InvalidOperationException("Website host could not be resolved.");

        foreach (var address in addresses)
        {
            if (IsBlockedAddress(address))
                throw new InvalidOperationException("Website URL resolves to a blocked network range.");
        }
    }

    private static bool IsBlockedAddress(IPAddress address)
    {
        if (IPAddress.IsLoopback(address) || IPAddress.IPv6Loopback.Equals(address))
            return true;

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var bytes = address.GetAddressBytes();
            return bytes[0] == 10
                || bytes[0] == 127
                || (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
                || (bytes[0] == 192 && bytes[1] == 168)
                || (bytes[0] == 169 && bytes[1] == 254);
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (address.IsIPv6LinkLocal || address.IsIPv6SiteLocal)
                return true;

            var bytes = address.GetAddressBytes();
            return bytes[0] == 0xFC || bytes[0] == 0xFD;
        }

        return false;
    }

    private static bool IsRedirect(HttpStatusCode statusCode)
        => statusCode is HttpStatusCode.Moved
            or HttpStatusCode.Redirect
            or HttpStatusCode.RedirectMethod
            or HttpStatusCode.TemporaryRedirect
            or HttpStatusCode.PermanentRedirect;
}
