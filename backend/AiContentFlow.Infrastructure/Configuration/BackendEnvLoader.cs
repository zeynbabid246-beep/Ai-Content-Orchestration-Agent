namespace AiContentFlow.Infrastructure.Configuration;

public static class BackendEnvLoader
{
    public static void Load()
    {
        foreach (var path in CandidatePaths())
        {
            if (!File.Exists(path))
                continue;

            DotNetEnv.Env.Load(path);
            return;
        }
    }

    private static IEnumerable<string> CandidatePaths()
    {
        var cwd = Directory.GetCurrentDirectory();

        yield return Path.Combine(cwd, ".env");
        yield return Path.Combine(cwd, "backend", ".env");

        var dir = new DirectoryInfo(cwd);
        while (dir is not null)
        {
            yield return Path.Combine(dir.FullName, "backend", ".env");
            yield return Path.Combine(dir.FullName, ".env");
            dir = dir.Parent;
        }
    }
}
