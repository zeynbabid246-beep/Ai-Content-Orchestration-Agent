import {
  ContentType,
  SocialPlatform,
  type ContentPostVariant,
} from "../../content-posts/content-posts.types";
import { formatGeneratedContentPreview, extractCreativeAssets } from "../../campaigns/lib/formatGeneratedContent";
import type { QuickVariantDefinition, QuickVariantDraft, VariantFormat } from "../generate.types";
import { QUICK_VARIANT_DEFINITIONS } from "../generate.types";

export interface ParsedAiContent {
  text: string;
  slides: string[];
  format: VariantFormat;
}

export function getVariantDefinition(key: QuickVariantDraft["key"]): QuickVariantDefinition {
  return QUICK_VARIANT_DEFINITIONS.find((item) => item.key === key)!;
}

export function parseAiContent(contentJson: string, format: VariantFormat): ParsedAiContent {
  try {
    const parsed = JSON.parse(contentJson) as {
      text?: string;
      slides?: string[] | Array<{ title?: string; text?: string }>;
      format?: string;
      preview?: string;
      generated?: Record<string, unknown>;
    };

    if (parsed.preview || parsed.generated) {
      const text = formatGeneratedContentPreview(contentJson);
      const generated = parsed.generated ?? {};
      const rawSlides = generated.slides;
      const slides = Array.isArray(rawSlides)
        ? rawSlides
            .map((slide) => {
              if (typeof slide === "string") return slide.trim();
              const item = slide as { title?: string; text?: string };
              return [item.title, item.text].filter(Boolean).join("\n").trim();
            })
            .filter(Boolean)
        : [];
      const resolvedFormat =
        format === "carousel" ||
        slides.length > 0 ||
        String(generated.content_type ?? "").toLowerCase().includes("carousel")
          ? "carousel"
          : "post";
      return {
        text,
        slides: resolvedFormat === "carousel" && slides.length === 0 ? splitCarouselFallback(text) : slides,
        format: resolvedFormat,
      };
    }

    const text = parsed.text?.trim() ?? contentJson.trim();
    const slides = Array.isArray(parsed.slides)
      ? parsed.slides
          .map((slide) => (typeof slide === "string" ? slide.trim() : String(slide)))
          .filter(Boolean)
      : [];
    const resolvedFormat =
      parsed.format === "carousel" || format === "carousel" || slides.length > 0
        ? "carousel"
        : "post";
    return {
      text,
      slides: resolvedFormat === "carousel" && slides.length === 0 ? splitCarouselFallback(text) : slides,
      format: resolvedFormat,
    };
  } catch {
    if (format === "carousel") {
      return { text: "", slides: splitCarouselFallback(contentJson), format: "carousel" };
    }
    return { text: contentJson.trim(), slides: [], format: "post" };
  }
}

function splitCarouselFallback(raw: string): string[] {
  return raw
    .split(/\n---\n|\n\n(?=\d+[\).]\s)/)
    .map((part) => part.replace(/^\d+[\).]\s*/, "").trim())
    .filter(Boolean);
}

export function buildVariantContentJson(
  variant: QuickVariantDraft,
  imageUrl?: string | null
): string {
  const definition = getVariantDefinition(variant.key);

  // If contentJson is already in normalized form (has 'text' directly), use it and
  // inject imageUrl if needed. Raw AI responses have 'preview'/'generated' wrappers
  // that the publishers cannot read — those fall through to rebuild from body/slides.
  if (variant.contentJson?.trim()) {
    try {
      const parsed = JSON.parse(variant.contentJson) as Record<string, unknown>;
      if (typeof parsed.text === "string") {
        return JSON.stringify({ ...parsed, ...(imageUrl != null ? { imageUrl } : {}) });
      }
    } catch {
      // fall through to rebuild
    }
  }

  if (definition.format === "carousel") {
    return JSON.stringify({
      text: variant.body,
      slides: variant.slides.filter(Boolean),
      format: "carousel",
      platform: definition.platform,
      ...(imageUrl != null ? { imageUrl } : {}),
    });
  }

  return JSON.stringify({
    text: variant.body,
    format: "post",
    platform: definition.platform,
    ...(imageUrl != null ? { imageUrl } : {}),
  });
}

export function resolveVariantPreviewImage(
  variant: QuickVariantDraft,
  sharedImageUrl?: string | null
): string | null {
  if (variant.posterUrl) return variant.posterUrl;
  if (variant.carouselAssets?.length) return variant.carouselAssets[0] ?? null;
  if (variant.contentJson) {
    const definition = getVariantDefinition(variant.key);
    const platformKey = definition.platform.toLowerCase();
    const assets = extractCreativeAssets(variant.contentJson, platformKey);
    if (assets.posterUrl) return assets.posterUrl;
    if (assets.carouselAssets.length > 0) return assets.carouselAssets[0];
  }
  return sharedImageUrl ?? null;
}

/** One variant per social platform (Instagram carousel wins over post if both enabled). */
export function toContentPostVariants(
  variants: QuickVariantDraft[],
  imageUrl?: string | null
): ContentPostVariant[] {
  const enabled = variants.filter((variant) => variant.enabled);
  const byPlatform = new Map<SocialPlatform, QuickVariantDraft>();

  for (const variant of enabled) {
    const platform = getVariantDefinition(variant.key).platform;
    const existing = byPlatform.get(platform);
    if (!existing) {
      byPlatform.set(platform, variant);
      continue;
    }
    const existingDef = getVariantDefinition(existing.key);
    const nextDef = getVariantDefinition(variant.key);
    if (nextDef.format === "carousel" && existingDef.format === "post") {
      byPlatform.set(platform, variant);
    }
  }

  return [...byPlatform.values()].map((variant) => ({
    platform: getVariantDefinition(variant.key).platform,
    title: variant.title.trim() || "Quick post",
    contentJson: buildVariantContentJson(variant, imageUrl),
  }));
}

export function findVariantForPlatform(
  variants: QuickVariantDraft[],
  platform: SocialPlatform
): QuickVariantDraft | undefined {
  const enabled = variants.filter((variant) => variant.enabled);
  const matches = enabled.filter((variant) => getVariantDefinition(variant.key).platform === platform);
  if (matches.length === 0) return undefined;
  const carousel = matches.find((variant) => getVariantDefinition(variant.key).format === "carousel");
  return carousel ?? matches[0];
}

export function variantHasContent(variant: QuickVariantDraft): boolean {
  const definition = getVariantDefinition(variant.key);
  if (definition.format === "carousel") {
    return Boolean(variant.body.trim() || variant.slides.some(Boolean));
  }
  return variant.body.trim().length > 0;
}

export function defaultContentType(platform: SocialPlatform): ContentType {
  switch (platform) {
    case SocialPlatform.Facebook:
      return ContentType.FacebookPost;
    case SocialPlatform.Instagram:
      return ContentType.InstagramPost;
    case SocialPlatform.Threads:
      return ContentType.LinkedInPost;
    case SocialPlatform.LinkedIn:
    default:
      return ContentType.LinkedInPost;
  }
}

export function slidesToCsv(slides: string[]): string {
  return slides.join("\n---\n");
}

export function csvToSlides(value: string): string[] {
  return value
    .split("\n---\n")
    .map((part) => part.trim())
    .filter(Boolean);
}
