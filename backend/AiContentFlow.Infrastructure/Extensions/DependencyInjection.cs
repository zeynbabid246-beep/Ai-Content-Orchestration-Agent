using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Application.Features.Channels;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.SocialAccounts;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Domain.Campaigns.Interfaces;
using AiContentFlow.Infrastructure.Identity;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Persistence.Repositories;
using AiContentFlow.Infrastructure.Repositories;
using AiContentFlow.Infrastructure.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Reflection;
using System.Text;

namespace AiContentFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProjectDependencies(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Database & Identity
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // 2. Repositories (Infrastructure)
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<IContentPostRepository, ContentPostRepository>();
        services.AddScoped<IChannelRepository, ChannelRepository>();
        services.AddScoped<ISocialAccountRepository, SocialAccountRepository>();
        services.AddScoped<ICampaignRepository, CampaignRepository>();
        services.AddScoped<ICampaignContentPostRepository, CampaignContentPostRepository>();
        services.AddScoped<IApplicationTransaction, EfCoreApplicationTransaction>();

        // 3. Application Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IContentPostService, ContentPostService>();
        services.AddScoped<IChannelService, ChannelService>();
        services.AddScoped<ISocialAccountService, SocialAccountService>();
        services.AddScoped<ICampaignService, CampaignService>();

        // Email Service Configuration
        services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
        services.AddScoped<IEmailService, SmtpEmailService>();

        // 4. FluentValidation (Scans the Application assembly for all validators)
        // Pass a type from your Application layer so it knows which assembly to scan
        services.AddValidatorsFromAssembly(Assembly.GetAssembly(typeof(IAuthService)));

        // 5. JWT Authentication
        var jwtSettings = configuration.GetSection("Jwt");
        services.AddAuthentication(options =>
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

        services.AddAuthorization();

        return services;
    }
}