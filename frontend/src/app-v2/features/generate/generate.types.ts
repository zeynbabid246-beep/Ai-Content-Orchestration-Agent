import { SocialPlatform } from "../content-posts/content-posts.types";

export type ComposeMode = "manual" | "ai";

export type QuickPostMode = "textOnly" | "withImage";

export type ImagePostType = "staticImage" | "infographic" | "carousel";

export type QuickGeneratePostType = "TextOnly" | "StaticImage" | "Infographic" | "Carousel";

export type VariantFormat = "post" | "carousel";

export type QuickVariantKey =
  | "linkedin-post"
  | "facebook-post"
  | "instagram-post"
  | "instagram-carousel"
  | "threads-post";

export interface QuickVariantDefinition {
  key: QuickVariantKey;
  label: string;
  platform: SocialPlatform;
  format: VariantFormat;
  description: string;
}

export interface QuickVariantDraft {
  key: QuickVariantKey;
  enabled: boolean;
  title: string;
  body: string;
  slides: string[];
  contentJson?: string;
  posterUrl?: string | null;
  carouselAssets?: string[];
  creativeError?: string | null;
}

export function mapQuickGeneratePostType(
  postMode: QuickPostMode,
  imagePostType: ImagePostType
): QuickGeneratePostType {
  if (postMode === "textOnly") return "TextOnly";
  switch (imagePostType) {
    case "infographic":
      return "Infographic";
    case "carousel":
      return "Carousel";
    case "staticImage":
    default:
      return "StaticImage";
  }
}

export function postTypeNeedsVisuals(postType: QuickGeneratePostType): boolean {
  return postType !== "TextOnly";
}

export const QUICK_VARIANT_DEFINITIONS: QuickVariantDefinition[] = [
  {
    key: "linkedin-post",
    label: "LinkedIn Post",
    platform: SocialPlatform.LinkedIn,
    format: "post",
    description: "Professional feed post",
  },
  {
    key: "facebook-post",
    label: "Facebook Post",
    platform: SocialPlatform.Facebook,
    format: "post",
    description: "Facebook page feed post",
  },
  {
    key: "instagram-post",
    label: "Instagram Post",
    platform: SocialPlatform.Instagram,
    format: "post",
    description: "Single-image caption post",
  },
  {
    key: "instagram-carousel",
    label: "Instagram Carousel",
    platform: SocialPlatform.Instagram,
    format: "carousel",
    description: "Multi-slide carousel with caption",
  },
  {
    key: "threads-post",
    label: "Threads Post",
    platform: SocialPlatform.Threads,
    format: "post",
    description: "Short conversational Threads post",
  },
];

export function createInitialVariants(): QuickVariantDraft[] {
  return QUICK_VARIANT_DEFINITIONS.map((definition) => ({
    key: definition.key,
    enabled: false,
    title: "",
    body: "",
    slides: definition.format === "carousel" ? ["", ""] : [],
  }));
}
