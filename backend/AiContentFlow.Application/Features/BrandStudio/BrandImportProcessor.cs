using System.Text.Json;
using Application.Interfaces;
using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Domain.Models;
using Microsoft.Extensions.Configuration;

namespace AiContentFlow.Application.Features.BrandStudio;

public class BrandImportProcessor : IBrandImportProcessor
{
    private readonly IBrandStudioRepository _brandStudioRepository;
    private readonly ILocalAiBackendClient _localAiBackendClient;
    private readonly ITextGenerationService _textGenerationService;
    private readonly IConfiguration _configuration;

    public BrandImportProcessor(
        IBrandStudioRepository brandStudioRepository,
        ILocalAiBackendClient localAiBackendClient,
        ITextGenerationService textGenerationService,
        IConfiguration configuration)
    {
        _brandStudioRepository = brandStudioRepository;
        _localAiBackendClient = localAiBackendClient;
        _textGenerationService = textGenerationService;
        _configuration = configuration;
    }

    public async Task ProcessAsync(int importJobId, CancellationToken cancellationToken = default)
    {
        var job = await _brandStudioRepository.GetJobByIdForProcessingAsync(importJobId)
            ?? throw new KeyNotFoundException("Brand import job not found");

        if (job.Status != BrandImportJobStatus.Queued && job.Status != BrandImportJobStatus.Processing)
        {
            return;
        }

        var utcNow = DateTime.UtcNow;
        job.MarkProcessing(utcNow);
        await _brandStudioRepository.SaveChangesAsync();

        try
        {
            var brandStudio = job.TeamBrandStudio
                ?? throw new InvalidOperationException("Brand Studio profile missing for import job");

            var correlationId = Guid.NewGuid().ToString("N");
            var orgId = $"team_{job.TeamId:N}";

            JsonElement payload;
            if (IsExternalProviderMode())
                payload = await AnalyzeBrandWithGroqAsync(job.WebsiteUrl, orgId, cancellationToken);
            else
                payload = await _localAiBackendClient.AnalyzeBrandAsync(orgId, job.WebsiteUrl, correlationId, cancellationToken);

            BrandProfileMapper.ApplyAiPayload(brandStudio, payload, job.WebsiteUrl, orgId);
            brandStudio.UpdatedAt = DateTime.UtcNow;

            job.MarkCompleted(DateTime.UtcNow, JsonSerializer.Serialize(payload));

            await _brandStudioRepository.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            job.MarkFailed(ex.Message, DateTime.UtcNow);
            await _brandStudioRepository.SaveChangesAsync();
            throw;
        }
    }

    private bool IsExternalProviderMode()
    {
        var mode = _configuration["AI:ProviderMode"] ?? "LocalBackend";
        return mode.Equals("ExternalProviders", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<JsonElement> AnalyzeBrandWithGroqAsync(string websiteUrl, string orgId, CancellationToken cancellationToken)
    {
        var prompt = $$"""
            You are a brand analyst. Analyze the brand at this website: {{websiteUrl}}

            Based on your knowledge of this brand (or inferring from the domain name), provide accurate brand information.
            For well-known brands, use their real colors and logo URLs.
            For unknown brands, make educated guesses based on the domain name and industry.

            Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
            {
              "parsed_profile": {
                "org_id": "{{orgId}}",
                "website_url": "{{websiteUrl}}",
                "brand_name": "Real brand name from the domain",
                "brand_summary": "1-2 sentence description of what the company does",
                "slogan": "tagline if known, or null",
                "value_proposition": ["key value 1", "key value 2"],
                "tone_of_voice": ["professional", "friendly"],
                "audience_signals": ["target audience description"],
                "content_pillars": ["pillar 1", "pillar 2", "pillar 3"],
                "key_messages": ["message 1", "message 2"],
                "business_info": "short description of the business",
                "email": null,
                "visual_identity": {
                  "logo_url": "direct URL to brand logo if known (e.g. https://logo.clearbit.com/domain.com), or null",
                  "favicon_url": "https://www.google.com/s2/favicons?domain={{websiteUrl}}&sz=64",
                  "primary_colors": ["#HEXCODE1", "#HEXCODE2"],
                  "secondary_colors": ["#HEXCODE3"],
                  "font_families": ["font name if known"],
                  "image_urls": [],
                  "visual_style": "modern/minimal/bold/elegant/etc",
                  "hero_text": null,
                  "cta_texts": [],
                  "screenshot_path": null,
                  "render_mode": null,
                  "has_logo": true,
                  "has_images": false
                }
              },
              "enriched_profile": {
                "brand_personality": ["trait 1", "trait 2"],
                "brand_archetype": "archetype name",
                "positioning_statement": "positioning statement",
                "voice_guidelines": {
                  "do": ["do this", "do that"],
                  "dont": ["avoid this", "avoid that"]
                },
                "messaging_priorities": ["priority 1", "priority 2"],
                "visual_direction_notes": "visual style notes",
                "linkedin_voice": "professional and insightful",
                "ad_copy_style": "direct and benefit-focused"
              }
            }
            """;

        var json = await _textGenerationService.GenerateTextAsync(prompt, "llama-3.3-70b-versatile", AiUseCase.BrandExtraction);

        var start = json.IndexOf('{');
        var end = json.LastIndexOf('}');
        if (start >= 0 && end > start)
            json = json[start..(end + 1)];

        return JsonDocument.Parse(json).RootElement;
    }
}
