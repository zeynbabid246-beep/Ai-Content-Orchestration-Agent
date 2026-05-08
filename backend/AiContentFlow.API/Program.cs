using AiContentFlow.API.Middleware;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Workers;
using Hangfire;
using Hangfire.PostgreSql;
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => origin.StartsWith("http://localhost"))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
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
app.UseStaticFiles();
app.UseMiddleware<ExceptionMiddleware>();

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
}

app.MapControllers();

app.Run();
