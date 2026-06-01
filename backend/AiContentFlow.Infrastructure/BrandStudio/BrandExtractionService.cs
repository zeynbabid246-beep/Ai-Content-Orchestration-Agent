using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using AiContentFlow.Application.Common.Interfaces;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AiContentFlow.Infrastructure.BrandStudio;

public partial class BrandExtractionService : IBrandExtractionService
{
    private readonly ITextGenerationService? _textGeneration;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BrandExtractionService> _logger;

    public BrandExtractionService(
        IConfiguration configuration,
        ILogger<BrandExtractionService> logger,
        ITextGenerationService? textGeneration = null)
    {
        _configuration = configuration;
        _logger = logger;
        _textGeneration = textGeneration;
    }

    public async Task<BrandExtractionResult> ExtractAsync(
        string websiteUrl,
        string html,
        CancellationToken cancellationToken = default)
    {
        var heuristic = ExtractHeuristic(websiteUrl, html);

        if (!ShouldUseLlm())
            return heuristic;

        try
        {
            var prompt = BuildPrompt(websiteUrl, html);
            var model = _configuration["BrandStudio:ExtractionModel"] ?? "groq";
            var json = await _textGeneration!.GenerateTextAsync(prompt, model, AiUseCase.BrandExtraction);
            var llm = ParseLlmJson(json);
            return Merge(heuristic, llm);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM brand extraction failed; using heuristic extraction.");
            return heuristic;
        }
    }

    private bool ShouldUseLlm()
    {
        if (_textGeneration is null)
            return false;

        return !string.IsNullOrWhiteSpace(_configuration["OpenAI:ApiKey"])
            || !string.IsNullOrWhiteSpace(_configuration["Groq:ApiKey"])
            || !string.IsNullOrWhiteSpace(_configuration["Gemini:ApiKey"]);
    }

    private static BrandExtractionResult ExtractHeuristic(string websiteUrl, string html)
    {
        var title = MatchMeta(html, "og:title")
            ?? MatchMeta(html, "twitter:title")
            ?? MatchTag(html, "title")
            ?? BuildCompanyName(new Uri(websiteUrl).Host);

        var description = MatchMeta(html, "og:description")
            ?? MatchMeta(html, "description")
            ?? ExtractParagraph(html);

        var textSample = StripHtml(html);
        var keywords = ExtractKeywords(textSample);

        return new BrandExtractionResult(
            CompanyName: title,
            Description: description ?? $"Brand profile extracted from {websiteUrl}.",
            Mission: ExtractSentence(textSample, "mission", "purpose", "vision") ?? "Mission not explicitly stated on the website.",
            TargetAudience: ExtractSentence(textSample, "customers", "audience", "clients") ?? "Target audience not explicitly stated on the website.",
            ToneOfVoice: "Professional, clear, trustworthy",
            Keywords: keywords,
            Products: [],
            Services: []);
    }

    private static BrandExtractionResult ParseLlmJson(string json)
    {
        using var doc = JsonDocument.Parse(ExtractJsonObject(json));
        var root = doc.RootElement;

        return new BrandExtractionResult(
            CompanyName: root.GetProperty("companyName").GetString() ?? "Company",
            Description: root.GetProperty("description").GetString() ?? "",
            Mission: root.GetProperty("mission").GetString() ?? "",
            TargetAudience: root.GetProperty("targetAudience").GetString() ?? "",
            ToneOfVoice: root.GetProperty("toneOfVoice").GetString() ?? "Professional",
            Keywords: root.TryGetProperty("keywords", out var keywords)
                ? keywords.EnumerateArray().Select(k => k.GetString() ?? "").Where(k => k.Length > 0).ToList()
                : [],
            Products: root.TryGetProperty("products", out var products)
                ? products.EnumerateArray().Select(p => p.GetString() ?? p.ToString()).Where(p => p.Length > 0).ToList()
                : [],
            Services: root.TryGetProperty("services", out var services)
                ? services.EnumerateArray().Select(s => s.GetString() ?? s.ToString()).Where(s => s.Length > 0).ToList()
                : []);
    }

    private static BrandExtractionResult Merge(BrandExtractionResult heuristic, BrandExtractionResult llm)
        => new(
            string.IsNullOrWhiteSpace(llm.CompanyName) ? heuristic.CompanyName : llm.CompanyName,
            string.IsNullOrWhiteSpace(llm.Description) ? heuristic.Description : llm.Description,
            string.IsNullOrWhiteSpace(llm.Mission) ? heuristic.Mission : llm.Mission,
            string.IsNullOrWhiteSpace(llm.TargetAudience) ? heuristic.TargetAudience : llm.TargetAudience,
            string.IsNullOrWhiteSpace(llm.ToneOfVoice) ? heuristic.ToneOfVoice : llm.ToneOfVoice,
            llm.Keywords.Count > 0 ? llm.Keywords : heuristic.Keywords,
            llm.Products.Count > 0 ? llm.Products : heuristic.Products,
            llm.Services.Count > 0 ? llm.Services : heuristic.Services);

    private static string BuildPrompt(string websiteUrl, string html)
    {
        var sample = StripHtml(html);
        if (sample.Length > 12_000)
            sample = sample[..12_000];

        return $"""
            Extract brand information from this website ({websiteUrl}) and return ONLY valid JSON with keys:
            companyName, description, mission, targetAudience, toneOfVoice, keywords (string array), products (array), services (array).

            Website text sample:
            {sample}
            """;
    }

    private static string ExtractJsonObject(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start)
            throw new InvalidOperationException("LLM response did not contain JSON.");

        return text[start..(end + 1)];
    }

    private static string? MatchMeta(string html, string name)
    {
        var pattern = $"""<meta[^>]+(?:name|property)=["']{Regex.Escape(name)}["'][^>]+content=["']([^"']+)["']""";
        var match = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
        return match.Success ? WebUtility.HtmlDecode(match.Groups[1].Value.Trim()) : null;
    }

    private static string? MatchTag(string html, string tag)
    {
        var match = Regex.Match(html, $"<{tag}[^>]*>(.*?)</{tag}>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return match.Success ? WebUtility.HtmlDecode(StripHtml(match.Groups[1].Value).Trim()) : null;
    }

    private static string StripHtml(string html)
        => HtmlTagRegex().Replace(html, " ").Replace("&nbsp;", " ", StringComparison.OrdinalIgnoreCase).Trim();

    private static string? ExtractParagraph(string html)
    {
        var match = Regex.Match(html, "<p[^>]*>(.*?)</p>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (!match.Success)
            return null;

        var text = StripHtml(match.Groups[1].Value);
        return text.Length > 20 ? text[..Math.Min(text.Length, 500)] : null;
    }

    private static string? ExtractSentence(string text, params string[] hints)
    {
        var sentences = text.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return sentences.FirstOrDefault(s => hints.Any(h => s.Contains(h, StringComparison.OrdinalIgnoreCase)));
    }

    private static List<string> ExtractKeywords(string text)
    {
        var words = Regex.Split(text.ToLowerInvariant(), @"\W+")
            .Where(w => w.Length is >= 4 and <= 20)
            .GroupBy(w => w)
            .OrderByDescending(g => g.Count())
            .Take(8)
            .Select(g => g.Key)
            .ToList();

        return words.Count > 0 ? words : ["brand", "content", "marketing"];
    }

    private static string BuildCompanyName(string host)
    {
        var segment = host.Replace("www.", string.Empty).Split('.').FirstOrDefault() ?? "Company";
        return string.Join(' ', segment.Split('-', StringSplitOptions.RemoveEmptyEntries));
    }

    [GeneratedRegex("<[^>]+>", RegexOptions.Compiled)]
    private static partial Regex HtmlTagRegex();
}
