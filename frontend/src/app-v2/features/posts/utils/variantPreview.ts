import {
  SocialPlatform,
  type ContentPostVariant,
} from "../../content-posts/content-posts.types";
import type { QuickVariantDefinition } from "../../generate/generate.types";

const PLATFORM_PREVIEW: Record<SocialPlatform, QuickVariantDefinition> = {
  [SocialPlatform.LinkedIn]: {
    key: "linkedin-post",
    label: "LinkedIn",
    platform: SocialPlatform.LinkedIn,
    format: "post",
    description: "",
  },
  [SocialPlatform.Facebook]: {
    key: "facebook-post",
    label: "Facebook",
    platform: SocialPlatform.Facebook,
    format: "post",
    description: "",
  },
  [SocialPlatform.Instagram]: {
    key: "instagram-post",
    label: "Instagram",
    platform: SocialPlatform.Instagram,
    format: "post",
    description: "",
  },
  [SocialPlatform.X]: {
    key: "linkedin-post",
    label: "X",
    platform: SocialPlatform.X,
    format: "post",
    description: "",
  },
  [SocialPlatform.Threads]: {
    key: "threads-post",
    label: "Threads",
    platform: SocialPlatform.Threads,
    format: "post",
    description: "",
  },
  [SocialPlatform.TikTok]: {
    key: "instagram-post",
    label: "TikTok",
    platform: SocialPlatform.TikTok,
    format: "post",
    description: "",
  },
};

export function getPreviewDefinitionForPlatform(platform: SocialPlatform): QuickVariantDefinition {
  return PLATFORM_PREVIEW[platform];
}

export function parseVariantContentJson(contentJson: string): {
  text: string;
  title: string;
  slides: string[];
} {
  if (!contentJson.trim()) {
    return { text: "", title: "", slides: [] };
  }
  try {
    const parsed = JSON.parse(contentJson) as {
      text?: string;
      title?: string;
      slides?: string[];
      caption?: string;
    };
    const text = parsed.text?.trim() ?? parsed.caption?.trim() ?? "";
    const title = parsed.title?.trim() ?? "";
    const slides = Array.isArray(parsed.slides) ? parsed.slides.filter(Boolean) : [];
    return { text, title, slides };
  } catch {
    return { text: contentJson, title: "", slides: [] };
  }
}

export function buildVariantContentJson(
  text: string,
  platform: SocialPlatform,
  title?: string,
  imageUrl?: string | null
): string {
  return JSON.stringify({
    text,
    platform,
    ...(title?.trim() ? { title: title.trim() } : {}),
    ...(imageUrl?.trim() ? { imageUrl: imageUrl.trim() } : {}),
  });
}

export function mergeVariantsWithImage(
  variants: ContentPostVariant[],
  imageUrl: string | null
): ContentPostVariant[] {
  if (!imageUrl?.trim()) return variants;
  return variants.map((variant) => {
    const parsed = parseVariantContentJson(variant.contentJson);
    return {
      ...variant,
      contentJson: buildVariantContentJson(
        parsed.text,
        variant.platform,
        parsed.title || variant.title,
        imageUrl
      ),
    };
  });
}

export function syncVariantsForPlatforms(
  platforms: SocialPlatform[],
  variants: ContentPostVariant[],
  masterTitle: string,
  masterBody: string,
  imageUrl?: string | null
): ContentPostVariant[] {
  return platforms.map((platform) => {
    const existing = variants.find((v) => v.platform === platform);
    if (existing) {
      if (imageUrl?.trim()) {
        const parsed = parseVariantContentJson(existing.contentJson);
        return {
          ...existing,
          contentJson: buildVariantContentJson(
            parsed.text,
            platform,
            parsed.title || existing.title,
            imageUrl
          ),
        };
      }
      return existing;
    }
    return {
      platform,
      title: masterTitle.trim() || "Post",
      contentJson: buildVariantContentJson(masterBody, platform, masterTitle, imageUrl),
    };
  });
}

export const PUBLISHABLE_PLATFORMS: SocialPlatform[] = [
  SocialPlatform.LinkedIn,
  SocialPlatform.Facebook,
  SocialPlatform.Instagram,
  SocialPlatform.Threads,
];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  [SocialPlatform.Facebook]: "Facebook",
  [SocialPlatform.LinkedIn]: "LinkedIn",
  [SocialPlatform.Instagram]: "Instagram",
  [SocialPlatform.X]: "X",
  [SocialPlatform.Threads]: "Threads",
  [SocialPlatform.TikTok]: "TikTok",
};

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  [SocialPlatform.Facebook]: "#1877F2",
  [SocialPlatform.LinkedIn]: "#0A66C2",
  [SocialPlatform.Instagram]: "#E1306C",
  [SocialPlatform.X]: "#0EA5E9",
  [SocialPlatform.Threads]: "#94A3B8",
  [SocialPlatform.TikTok]: "#000000",
};
