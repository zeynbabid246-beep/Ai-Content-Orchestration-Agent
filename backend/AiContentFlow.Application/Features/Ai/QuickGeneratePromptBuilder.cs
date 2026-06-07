namespace AiContentFlow.Application.Features.Ai;

internal static class QuickGeneratePromptBuilder
{
    public static string BuildVisualTypePromptHint(QuickGeneratePostType postType)
    {
        return postType switch
        {
            QuickGeneratePostType.StaticImage => """
                
                Generate a social media post with a clean marketing caption AND a separate visual_direction field for the poster Creative Agent.
                Return valid JSON only with this exact structure:
                {
                  "content_type": "Static Image",
                  "hook": "...",
                  "body": "...",
                  "cta": "...",
                  "hashtags": ["..."],
                  "visual_direction": "..."
                }
                Rules for hook/body/cta:
                - Plain text only, no markdown (no ** or __).
                - Marketing copy only — do NOT include poster instructions.
                - Do NOT include headings like Concept, Layout, Mood, Background in hook/body/cta.
                Rules for visual_direction:
                - Describe poster concept, required objects, layout, mood, and background.
                - Put camera, PC, laptop, phone, product, or other required visuals here.
                - This field is ONLY for the Creative Agent, not for the public caption.
                Do not put text inside the AI background image.
                """,
            QuickGeneratePostType.Infographic => """
                
                Generate a structured infographic post.
                Return valid JSON only with this exact structure:
                {
                  "content_type": "Infographic",
                  "title": "...",
                  "intro": "...",
                  "sections": [
                    {"heading": "...", "text": "..."}
                  ],
                  "cta": "...",
                  "hashtags": ["..."],
                  "visual_direction": "Design a clean infographic with numbered sections, icons, and clear hierarchy."
                }
                Rules: keep sections as a real JSON list. No markdown.
                """,
            QuickGeneratePostType.Carousel => """
                
                Generate a structured LinkedIn-style carousel post.
                Return valid JSON only with this exact structure:
                {
                  "content_type": "Carousel",
                  "hook": "...",
                  "slides": [
                    {"title": "...", "text": "...", "image_idea": "..."}
                  ],
                  "cta": "...",
                  "hashtags": ["..."],
                  "creative_direction": "Create a clean carousel with one idea per slide."
                }
                Rules: keep slides as a real JSON list. Do not put slides as a raw string in body.
                """,
            _ => """
                
                Generate a text-only social media status post. Do not generate poster instructions. Do not include visual direction.
                The post must be readable as text only. Return valid JSON with content_type="Text Post", hook, body, cta, and hashtags.
                """
        };
    }

    public static string BuildLanguageHint(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return string.Empty;

        return $"\nWrite the content in {language.Trim()}.";
    }
}
