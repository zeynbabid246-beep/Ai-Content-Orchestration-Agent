using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Infrastructure.Identity;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Persistence.Repositories;
using AiContentFlow.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft. EntityFrameworkCore;
using Microsoft. IdentityModel. Tokens;
using System. Text;


var builder = WebApplication.CreateBuilder(args);




builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();


var jwtSettings = builder.Configuration.GetSection("Jwt");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Secret"])
        )
    };
});
builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder. Build();

app. UseAuthentication();
app. UseAuthorization();

app.MapControllers();

app.Run();