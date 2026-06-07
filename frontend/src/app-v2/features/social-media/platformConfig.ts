import { SocialPlatform } from "./social-accounts.types";

export interface PlatformConfig {
  id: "linkedin" | "facebook" | "instagram" | "threads";
  name: string;
  description: string;
  glyph: string;
  color: string;
  enumValue: SocialPlatform;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Professional network",
    glyph: "in",
    color: "#0A66C2",
    enumValue: SocialPlatform.LinkedIn,
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Pages & community",
    glyph: "f",
    color: "#1877F2",
    enumValue: SocialPlatform.Facebook,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Business / Creator account",
    glyph: "ig",
    color: "#E1306C",
    enumValue: SocialPlatform.Instagram,
  },
  {
    id: "threads",
    name: "Threads",
    description: "Text and image posts",
    glyph: "@",
    color: "#94A3B8",
    enumValue: SocialPlatform.Threads,
  },
];

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  [SocialPlatform.LinkedIn]: "#0A66C2",
  [SocialPlatform.Facebook]: "#1877F2",
  [SocialPlatform.Instagram]: "#E1306C",
  [SocialPlatform.X]: "#000000",
  [SocialPlatform.Threads]: "#94A3B8",
  [SocialPlatform.TikTok]: "#010101",
};
