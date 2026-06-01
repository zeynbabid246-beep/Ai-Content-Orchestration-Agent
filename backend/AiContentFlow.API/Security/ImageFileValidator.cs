namespace AiContentFlow.API.Security;

public static class ImageFileValidator
{
    private static readonly Dictionary<string, byte[][]> Signatures = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = [[0xFF, 0xD8, 0xFF]],
        ["image/png"] = [[0x89, 0x50, 0x4E, 0x47]],
        ["image/gif"] = [[0x47, 0x49, 0x46, 0x38]],
        ["image/webp"] = [[0x52, 0x49, 0x46, 0x46]]
    };

    public static bool TryValidate(Stream stream, string contentType, out string? error)
    {
        error = null;

        if (!Signatures.TryGetValue(contentType, out var patterns))
        {
            error = "Unsupported image format.";
            return false;
        }

        var header = new byte[12];
        var read = stream.Read(header, 0, header.Length);
        stream.Position = 0;

        if (read < 4)
        {
            error = "File is too small to be a valid image.";
            return false;
        }

        var matches = patterns.Any(pattern =>
            read >= pattern.Length && header.Take(pattern.Length).SequenceEqual(pattern));

        if (!matches)
        {
            error = "File content does not match the declared image type.";
            return false;
        }

        if (contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase)
            && read >= 12
            && !header.Skip(8).Take(4).SequenceEqual(new byte[] { 0x57, 0x45, 0x42, 0x50 }))
        {
            error = "File content does not match the declared image type.";
            return false;
        }

        return true;
    }
}
