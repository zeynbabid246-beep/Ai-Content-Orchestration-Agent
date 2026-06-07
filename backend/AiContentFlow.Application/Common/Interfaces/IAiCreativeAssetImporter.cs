namespace AiContentFlow.Application.Common.Interfaces;

public interface IAiCreativeAssetImporter
{
    Task<string> ImportFromUrlAsync(Guid teamId, string sourceUrl, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> ImportManyAsync(
        Guid teamId,
        IEnumerable<string> sourceUrls,
        CancellationToken cancellationToken = default);
}
