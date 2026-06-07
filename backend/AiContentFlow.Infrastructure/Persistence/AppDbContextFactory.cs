using AiContentFlow.Infrastructure.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AiContentFlow.Infrastructure.Persistence;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        BackendEnvLoader.Load();

        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var basePath = ResolveApiProjectPath();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        optionsBuilder.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));

        return new AppDbContext(optionsBuilder.Options);
    }

    private static string ResolveApiProjectPath()
    {
        var current = Directory.GetCurrentDirectory();
        if (File.Exists(Path.Combine(current, "appsettings.json")))
            return current;

        var apiPath = Path.Combine(current, "..", "AiContentFlow.API");
        if (File.Exists(Path.Combine(apiPath, "appsettings.json")))
            return Path.GetFullPath(apiPath);

        return current;
    }
}