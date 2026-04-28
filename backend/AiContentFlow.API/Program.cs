using AiContentFlow.API.Middleware;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Workers;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using AiContentFlow.Infrastructure;
using Application.Interfaces;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Infrastructure.Extensions;
using AiContentFlow.Infrastructure.Factories;

var builder = WebApplication.CreateBuilder(args);

// 🔧 Project dependencies
builder.Services.AddProjectDependencies(builder.Configuration);

builder.Services.AddHangfire(config =>
{
    config.UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddHangfireServer();


builder.Services.AddSwaggerDocumentation();

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => origin.StartsWith("http://localhost"))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Auth services
builder.Services.AddScoped<IAuthServiceFactory, AuthServiceFactory>();
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

// Swagger middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {

        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AiContentFlow API v1");
        options.RoutePrefix = "swagger"; // optional (default)

        // If you don't touch it, the default is localhost:5073/swagger 
        // If you leave RoutePrefix empty, the URL is just localhost:5073/

        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");

    });

    app.UseHangfireDashboard("/hangfire");
}

//  Middleware pipeline
app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

RecurringJob.AddOrUpdate<PublishScheduledVariantsJob>(
    "publish-scheduled-variants",
    job => job.ExecuteAsync(CancellationToken.None),
    Cron.Minutely);

app.MapControllers();

app.Run();