import {
  ContentType,
  SocialPlatform,
  type ContentPostVariant,
} from "../../content-posts/content-posts.types";
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
      slides?: string[];
      format?: string;
    };
    const text = parsed.text?.trim() ?? contentJson.trim();
    const slides = Array.isArray(parsed.slides)
      ? parsed.slides.map((slide) => slide.trim()).filter(Boolean)
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
  if (definition.format === "carousel") {
    return JSON.stringify({
      text: variant.body,
      slides: variant.slides.filter(Boolean),
      format: "carousel",
      platform: definition.platform,
      imageUrl: imageUrl ?? undefined,
    });
  }

  return JSON.stringify({
    text: variant.body,
    format: "post",
    platform: definition.platform,
    imageUrl: imageUrl ?? undefined,
  });
}

export function toContentPostVariants(
  variants: QuickVariantDraft[],
  imageUrl?: string | null
): ContentPostVariant[] {
  return variants
    .filter((variant) => variant.enabled)
    .map((variant) => ({
      platform: getVariantDefinition(variant.key).platform,
      title: variant.title.trim() || "Quick post",
      contentJson: buildVariantContentJson(variant, imageUrl),
    }));
}

export function defaultContentType(platform: SocialPlatform): ContentType {
  switch (platform) {
    case SocialPlatform.Facebook:
      return ContentType.FacebookPost;
    case SocialPlatform.Instagram:
      return ContentType.InstagramPost;
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
