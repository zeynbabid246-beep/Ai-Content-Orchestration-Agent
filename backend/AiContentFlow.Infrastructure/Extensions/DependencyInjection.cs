using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Application.Features.Channels;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.SocialAccounts;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Domain.Campaigns.Interfaces;
using AiContentFlow.Infrastructure.Factories;
using AiContentFlow.Infrastructure.Identity;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Persistence.Repositories;
using AiContentFlow.Infrastructure.Publishers;
using AiContentFlow.Infrastructure.Repositories;
using AiContentFlow.Infrastructure.Services;
using AiContentFlow.Infrastructure.Workers;
using Application.Interfaces;
using Application.UseCases;
using FluentValidation;
using Infrastructure.Factories;
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

        // 2. Repositories
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<IContentPostRepository, ContentPostRepository>();
        services.AddScoped<IChannelRepository, ChannelRepository>();
        services.AddScoped<ISocialAccountRepository, SocialAccountRepository>();
        services.AddScoped<ICampaignRepository, CampaignRepository>();
        services.AddScoped<ICampaignContentPostRepository, CampaignContentPostRepository>();
        services.AddScoped<IPostVariantRepository, PostVariantRepository>();
        services.AddScoped<IApplicationTransaction, EfCoreApplicationTransaction>();

        // 3. AI Services
        services.AddHttpClient<ITextGenerationService, TextGenerationService>();
        services.AddHttpClient<IImageGenerationService, GeminiImageService>();

        // 4. Application Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IContentPostService, ContentPostService>();
        services.AddScoped<IChannelService, ChannelService>();
        services.AddScoped<ISocialAccountService, SocialAccountService>();
        services.AddScoped<ICampaignService, CampaignService>();


        // 5. Social Auth
        services.AddScoped<LinkedInAuthService>();
        services.AddScoped<ISocialAuthService, LinkedInAuthService>(sp =>
            sp.GetRequiredService<LinkedInAuthService>());
        services.AddScoped<ILinkedInAuthService, LinkedInAuthService>(sp =>
            sp.GetRequiredService<LinkedInAuthService>());
        services.AddScoped<IAuthServiceFactory, AuthServiceFactory>();

        // 6. Publishers
        services.AddHttpClient("LinkedIn");
        services.AddScoped<IPublisher, LinkedInPublisher>();
        services.AddScoped<IPublisherFactory, PublisherFactory>();

        // 7. Use Cases
        services.AddScoped<GeneratePostUseCase>();
        services.AddScoped<PublishPostUseCase>();
        services.AddScoped<GenerateAndPublishUseCase>();

        // 8. Background Jobs
        services.AddScoped<PublishScheduledVariantsJob>();

        

        // Email Service Configuration
        services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
        services.AddScoped<IEmailService, SmtpEmailService>();

        // 9. FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetAssembly(typeof(IAuthService)));

        // 10. JWT Authentication
        var jwtSettings = configuration.GetSection("Jwt");
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // ✅ prevents ASP.NET from remapping "sub" claim
            options.MapInboundClaims = false;

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