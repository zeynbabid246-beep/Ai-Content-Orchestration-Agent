using AiContentFlow.API.Middleware;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using AiContentFlow.Infrastructure;
using Application.Interfaces;
using AiContentFlow.Infrastructure.Factories;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 🔧 Project dependencies
builder.Services.AddProjectDependencies(builder.Configuration);


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
    });
}

//  Middleware pipeline
app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();