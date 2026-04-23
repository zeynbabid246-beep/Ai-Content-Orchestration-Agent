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
<<<<<<< HEAD
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AiContentFlow API v1");
        options.RoutePrefix = "swagger"; // optional (default)
=======
        // If you don't touch it, the default is localhost:5073/swagger 
        // If you leave RoutePrefix empty, the URL is just localhost:5073/

        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
>>>>>>> 6c86c05b86b6dc509665b451b0bd8a28ac642eb3
    });
}

//  Middleware pipeline
app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();