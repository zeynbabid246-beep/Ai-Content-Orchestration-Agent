using Microsoft. EntityFrameworkCore;
using Microsoft. IdentityModel. Tokens;
using System. Text;
using AiContentFlow.Application.Services;
using AiContentFlow.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
options. UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<TokenService>();

builder. Services.AddAuthentication("Bearer")
.AddJwtBearer("Bearer", options =>
{
var key = builder.Configuration["Jwt:Key"];

options. TokenValidationParameters = new TokenValidationParameters
{
ValidateIssuer = true,
ValidateAudience = true,
ValidateLifetime = true,
ValidateIssuerSigningKey = true,

ValidIssuer = builder.Configuration["Jwt:Issuer"],
ValidAudience = builder.Configuration["Jwt:Audience"],
IssuerSigningKey = new SymmetricSecurityKey(
Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),

ClockSkew = TimeSpan.Zero
};
});
builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder. Build();

app. UseAuthentication();
app. UseAuthorization();

app.MapControllers();

app.Run();