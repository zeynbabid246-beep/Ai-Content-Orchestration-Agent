using System.Net;
using AiContentFlow.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.AI;

public class AiCreativeAssetImporter : IAiCreativeAssetImporter
{
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AiCreativeAssetImporter> _logger;
    private readonly string _localAiBaseUrl;

    public AiCreativeAssetImporter(
        IHttpClientFactory httpClientFactory,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        ILogger<AiCreativeAssetImporter> logger)
    {
        _httpClient = httpClientFactory.CreateClient(nameof(AiCreativeAssetImporter));
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _localAiBaseUrl = (configuration["LocalAI:BaseUrl"] ?? "http://127.0.0.1:8000").TrimEnd('/');
        _httpClient.Timeout = TimeSpan.FromMinutes(2);
    }

    public async Task<string> ImportFromUrlAsync(
        Guid teamId,
        string sourceUrl,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sourceUrl))
            throw new InvalidOperationException("Creative asset URL is empty.");

        var downloadUrl = ResolveDownloadUrl(sourceUrl.Trim());
        using var response = await _httpClient.GetAsync(downloadUrl, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"Failed to download creative asset ({response.StatusCode}): {body}");
        }

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
        var extension = GuessExtension(contentType, downloadUrl);
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", teamId.ToString("N"));
        Directory.CreateDirectory(uploadsRoot);

        var filename = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(uploadsRoot, filename);
        await File.WriteAllBytesAsync(fullPath, bytes, cancellationToken);

        var relativePath = $"/uploads/{teamId:N}/{filename}";
        var publicUrl = BuildPublicUrl(relativePath);

        _logger.LogInformation(
            "Imported creative asset for team {TeamId} from {SourceUrl} to {PublicUrl}",
            teamId,
            downloadUrl,
            publicUrl);

        return publicUrl;
    }

    public async Task<IReadOnlyList<string>> ImportManyAsync(
        Guid teamId,
        IEnumerable<string> sourceUrls,
        CancellationToken cancellationToken = default)
    {
        var results = new List<string>();
        foreach (var url in sourceUrls.Where(u => !string.IsNullOrWhiteSpace(u)))
        {
            results.Add(await ImportFromUrlAsync(teamId, url, cancellationToken));
        }

        return results;
    }

    private string ResolveDownloadUrl(string sourceUrl)
    {
        if (Uri.TryCreate(sourceUrl, UriKind.Absolute, out var absolute))
            return absolute.ToString();

        if (sourceUrl.StartsWith('/'))
            return $"{_localAiBaseUrl}{sourceUrl}";

        return $"{_localAiBaseUrl}/{sourceUrl.TrimStart('/')}";
    }

    private string BuildPublicUrl(string relativePath)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is not null)
            return $"{httpContext.Request.Scheme}://{httpContext.Request.Host}{relativePath}";

        return relativePath;
    }

    private static string GuessExtension(string contentType, string downloadUrl)
    {
        return contentType.ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            "image/jpeg" or "image/jpg" => ".jpg",
            _ => TryGetExtensionFromUrl(downloadUrl) ?? ".png"
        };
    }

    private static string? TryGetExtensionFromUrl(string downloadUrl)
    {
        if (!Uri.TryCreate(downloadUrl, UriKind.Absolute, out var uri))
            return null;

        var ext = Path.GetExtension(WebUtility.UrlDecode(uri.AbsolutePath));
        return string.IsNullOrWhiteSpace(ext) ? null : ext;
    }
}
