using System.Text;
using AiContentFlow.API.Middleware;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Application.Features.Channels;
using AiContentFlow.Application.Features.Channels.Dtos;
using AiContentFlow.Application.Features.Channels.Validators;
using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.SocialAccounts;
using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using AiContentFlow.Application.Features.SocialAccounts.Validators;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Infrastructure.Identity;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Persistence.Repositories;
using AiContentFlow.Infrastructure.Repositories;
using AiContentFlow.Infrastructure.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IContentPostService, ContentPostService>();
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<ISocialAccountService, SocialAccountService>();
builder.Services.AddScoped<ICampaignService, CampaignService>();

builder.Services.AddScoped<IValidator<CreateChannelDto>, CreateChannelDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateChannelDto>, UpdateChannelDtoValidator>();
builder.Services.AddScoped<IValidator<CreateSocialAccountDto>, CreateSocialAccountDtoValidator>();
builder.Services.AddScoped<IValidator<UpdateSocialAccountDto>, UpdateSocialAccountDtoValidator>();

// Infrastructure Services
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IContentPostRepository, ContentPostRepository>();
builder.Services.AddScoped<IChannelRepository, ChannelRepository>();
builder.Services.AddScoped<ISocialAccountRepository, SocialAccountRepository>();
builder.Services.AddScoped<ICampaignRepository, CampaignRepository>();
builder.Services.AddScoped<ICampaignContentPostRepository, CampaignContentPostRepository>();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
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
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();  
app.UseAuthorization();   

app.MapControllers();

app.Run();