import { SocialPlatform, type ContentPostVariant } from "../../content-posts/content-posts.types";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import { getAccountsForPlatform } from "../../generate/utils/dedupeAccountsByPlatform";
import { parseVariantContentJson } from "./variantPreview";

export function variantHasContent(variant: ContentPostVariant | undefined): boolean {
  if (!variant) return false;
  const { text } = parseVariantContentJson(variant.contentJson);
  return text.trim().length > 0;
}

export function getReadyPlatforms(
  selectedPlatforms: SocialPlatform[],
  variants: ContentPostVariant[],
  channelAccounts: SocialAccount[],
  imageUrl: string | null
): SocialPlatform[] {
  return selectedPlatforms.filter((platform) => {
    const variant = variants.find((v) => v.platform === platform);
    if (!variantHasContent(variant)) return false;
    if (platform === SocialPlatform.Instagram && !imageUrl) return false;
    return getAccountsForPlatform(channelAccounts, platform).length > 0;
  });
}

export function minDatetimeLocalValue(bufferMinutes = 5): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + bufferMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
