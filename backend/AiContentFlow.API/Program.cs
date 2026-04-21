using AiContentFlow.API.Middleware;
using AiContentFlow.Infrastructure;
using AiContentFlow.Infrastructure.Extensions;
using AiContentFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Register everything in one go
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

var app = builder.Build();

// Automated Migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        // If you don't touch it, the default is localhost:5073/swagger 
        // If you leave RoutePrefix empty, the URL is just localhost:5073/

        options.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    });
}
app.UseCors("AllowFrontend");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();