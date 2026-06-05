/** Stored shape from .NET WrapGeneratedContent */
type WrappedAiContent = {
  source?: string;
  preview?: string;
  plannerContentType?: string;
  aiFormat?: string;
  generated?: Record<string, unknown>;
  text?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Human-readable preview for review UI and post editor fallback */
export function formatGeneratedContentPreview(contentJson: string): string {
  try {
    const parsed = JSON.parse(contentJson) as WrappedAiContent;
    if (parsed.preview?.trim()) return parsed.preview.trim();

    const gen = asRecord(parsed.generated) ?? asRecord(parsed);
    if (!gen) return contentJson;

    const parts: string[] = [];
    for (const key of ["hook", "title", "intro", "body", "cta"]) {
      const v = str(gen[key]);
      if (v) parts.push(v);
    }

    const sections = gen.sections;
    if (Array.isArray(sections)) {
      for (const section of sections) {
        const s = asRecord(section);
        if (!s) continue;
        const heading = str(s.heading);
        const text = str(s.text);
        if (heading) parts.push(heading);
        if (text) parts.push(text);
      }
    }

    const slides = gen.slides;
    if (Array.isArray(slides)) {
      for (const slide of slides) {
        const s = asRecord(slide);
        if (!s) continue;
        const title = str(s.title);
        const text = str(s.text);
        if (title) parts.push(`• ${title}`);
        if (text) parts.push(text);
      }
    }

    if (parts.length > 0) return parts.join("\n\n");

    const direction = str(gen.creative_direction) || str(gen.visual_direction);
    if (direction) return direction;

    return str(gen.text) || contentJson;
  } catch {
    return contentJson;
  }
}

export function parsePostText(contentJson: string): string {
  return formatGeneratedContentPreview(contentJson);
}

export function buildPostContentJson(text: string, previousContentJson?: string): string {
  try {
    if (previousContentJson) {
      const parsed = JSON.parse(previousContentJson) as WrappedAiContent;
      if (parsed.source === "ai_campaign") {
        return JSON.stringify({ ...parsed, preview: text });
      }
    }
  } catch {
    // fall through
  }
  return JSON.stringify({ text });
}
