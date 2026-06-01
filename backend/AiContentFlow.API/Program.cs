using System.Threading.RateLimiting;
using AiContentFlow.API.Middleware;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Workers;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using AiContentFlow.Infrastructure;
using Application.Interfaces;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Infrastructure.Extensions;
using AiContentFlow.Infrastructure.Factories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProjectDependencies(builder.Configuration);

builder.Services.AddHangfire(config =>
{
    config.UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddHangfireServer();

builder.Services.AddSwaggerDocumentation();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: false));
    });

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1)
            }));
    options.AddPolicy("sensitive", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.User.FindFirst("sub")?.Value
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddScoped<IAuthServiceFactory, AuthServiceFactory>();
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// Auto-migrate only in Development to avoid races in scaled production deployments.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AiContentFlow API v1");
        options.RoutePrefix = "swagger";
    });

    app.UseHangfireDashboard("/hangfire");
}

app.UseCors("AllowFrontend");
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    }
});
app.UseMiddleware<ExceptionMiddleware>();
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

using (var jobScope = app.Services.CreateScope())
{
    var recurringJobs = jobScope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    recurringJobs.AddOrUpdate<PublishScheduledVariantsJob>(
        "publish-scheduled-variants",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Minutely);

    recurringJobs.AddOrUpdate<SyncPublicationAnalyticsJob>(
        "sync-publication-analytics",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Hourly);

    recurringJobs.AddOrUpdate<SocialTokenRefreshJob>(
        "social-token-refresh",
        job => job.ExecuteAsync(CancellationToken.None),
        Cron.Daily);
}

app.MapControllers();

app.Run();
