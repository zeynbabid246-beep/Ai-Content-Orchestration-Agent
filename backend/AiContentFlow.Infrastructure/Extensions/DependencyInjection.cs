using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using AiContentFlow.Application.Features.Analytics;
using AiContentFlow.Application.Features.Ai;
using AiContentFlow.Application.Features.Auth;
using AiContentFlow.Application.Features.BrandStudio;
using AiContentFlow.Application.Features.Campaigns;
using AiContentFlow.Application.Features.Channels;
using AiContentFlow.Application.Features.ContentPosts;
using AiContentFlow.Application.Features.Publications;
using AiContentFlow.Application.Features.Profile;
using AiContentFlow.Application.Features.SocialAccounts;
using AiContentFlow.Application.Features.Teams;
using AiContentFlow.Domain.Campaigns.Interfaces;
using AiContentFlow.Infrastructure.Factories;
using AiContentFlow.Infrastructure.Identity;
using AiContentFlow.Infrastructure.Persistence;
using AiContentFlow.Infrastructure.Persistence.Repositories;
using AiContentFlow.Infrastructure.AI;
using AiContentFlow.Infrastructure.Publishers;
using AiContentFlow.Infrastructure.Repositories;
using AiContentFlow.Infrastructure.Services;
using Infrastructure.Services;
using AiContentFlow.Infrastructure.BrandStudio;
using AiContentFlow.Infrastructure.Workers;
using Application.Interfaces;
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
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // 2. Repositories
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<ITeamInvitationRepository, TeamInvitationRepository>();
        services.AddScoped<ITeamActivityRepository, TeamActivityRepository>();
        services.AddScoped<ITeamActivityService, TeamActivityService>();
        services.AddScoped<IContentPostRepository, ContentPostRepository>();
        services.AddScoped<IChannelRepository, ChannelRepository>();
        services.AddScoped<ISocialAccountRepository, SocialAccountRepository>();
        services.AddScoped<IChannelSocialAccountRepository, ChannelSocialAccountRepository>();
        services.AddScoped<ICampaignRepository, CampaignRepository>();
        services.AddScoped<IPostVariantRepository, PostVariantRepository>();
        services.AddScoped<IPostPublicationRepository, PostPublicationRepository>();
        services.AddScoped<IPublishJobRepository, PublishJobRepository>();
        services.AddScoped<IPublicationAnalyticsRepository, PublicationAnalyticsRepository>();
        services.AddScoped<IBrandStudioRepository, BrandStudioRepository>();
        services.AddScoped<IApplicationTransaction, EfCoreApplicationTransaction>();
        services.AddScoped<ISocialAuthStateService, SignedSocialAuthStateService>();
        services.AddScoped<ISocialCredentialStore, ProtectedSocialCredentialStore>();

        // 3. AI Services
        services.AddHttpClient(nameof(LocalAiBackendClient));
        services.AddScoped<ILocalAiBackendClient, LocalAiBackendClient>();
        services.AddHttpClient<ITextGenerationService, TextGenerationService>();
        services.AddHttpClient<IImageGenerationService, GeminiImageService>();
        services.AddHttpClient(nameof(SafeWebsiteFetcher));
        services.AddScoped<IWebsiteFetcher, SafeWebsiteFetcher>();
        services.AddScoped<IBrandExtractionService, BrandExtractionService>();

        // 4. Application Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IContentPostService, ContentPostService>();
        services.AddScoped<IChannelService, ChannelService>();
        services.AddScoped<IChannelSocialAccountService, ChannelSocialAccountService>();
        services.AddScoped<ISocialAccountService, SocialAccountService>();
        services.AddScoped<IPublicationService, PublicationService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IBrandStudioService, BrandStudioService>();
        services.AddScoped<IBrandImportProcessor, BrandImportProcessor>();
        services.AddScoped<AiContentFlow.Application.Features.SocialAuth.SocialAuthService>();
        services.AddScoped<ICampaignService, CampaignService>();
        services.AddScoped<IAiContentService, AiContentService>();


        // 5. Social Auth
        services.AddScoped<LinkedInAuthService>();
        services.AddScoped<ISocialAuthService, LinkedInAuthService>(sp =>
            sp.GetRequiredService<LinkedInAuthService>());
        services.AddScoped<ILinkedInAuthService, LinkedInAuthService>(sp =>
            sp.GetRequiredService<LinkedInAuthService>());
        services.AddHttpClient("Meta");
        services.AddScoped<MetaAuthService>();
        services.AddScoped<ISocialAuthService, MetaAuthService>(sp =>
            sp.GetRequiredService<MetaAuthService>());
        services.AddScoped<IAuthServiceFactory, AuthServiceFactory>();

        // 6. Publishers
        services.AddHttpClient("LinkedIn");
        services.AddHttpClient("Facebook");
        services.AddScoped<IPublisher, LinkedInPublisher>();
        services.AddScoped<IPublisher, FacebookPublisher>();
        services.AddScoped<IPublisher, InstagramPublisher>();
        services.AddScoped<IPublisherFactory, PublisherFactory>();

        // 7. Background Jobs
        services.AddScoped<PublishScheduledVariantsJob>();
        services.AddScoped<SyncPublicationAnalyticsJob>();
        services.AddScoped<BrandImportWorker>();
        services.AddScoped<SocialTokenRefreshJob>();
        services.AddScoped<IBrandImportJobScheduler, HangfireBrandImportJobScheduler>();

        

        // Email Service Configuration
        services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
        services.Configure<AppSettings>(configuration.GetSection("App"));
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