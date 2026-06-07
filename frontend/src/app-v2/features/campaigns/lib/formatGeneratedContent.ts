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

export type CreativeAssets = {
  posterUrl: string | null;
  carouselAssets: string[];
  creativeError: string | null;
};

/**
 * Extract poster and carousel assets from contentJson,
 * resolving platform_assets per the AI README rule:
 * - Check platform_assets[currentPlatform] first
 * - Fall back to top-level poster_url
 */
export function extractCreativeAssets(
  contentJson: string,
  platform?: string
): CreativeAssets {
  const empty: CreativeAssets = { posterUrl: null, carouselAssets: [], creativeError: null };
  try {
    const parsed = JSON.parse(contentJson) as WrappedAiContent;
    const gen = asRecord(parsed.generated) ?? asRecord(parsed);
    if (!gen) return empty;

    const creativeError = str(gen.creative_error) || null;

    if (platform) {
      const platformAssets = asRecord(gen.platform_assets);
      if (platformAssets) {
        const entry = asRecord(platformAssets[platform]);
        if (entry) {
          const poster = str(entry.poster_url) || str(entry.creative_asset_url) || null;
          const carousel = Array.isArray(entry.carousel_assets)
            ? (entry.carousel_assets as string[]).filter(Boolean)
            : [];
          if (poster || carousel.length > 0) {
            return { posterUrl: poster, carouselAssets: carousel, creativeError };
          }
        }
      }
    }

    const posterUrl = str(gen.poster_url) || str(gen.creative_asset_url) || null;
    const carouselAssets = Array.isArray(gen.carousel_assets)
      ? (gen.carousel_assets as string[]).filter(Boolean)
      : [];

    return { posterUrl, carouselAssets, creativeError };
  } catch {
    return empty;
  }
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
