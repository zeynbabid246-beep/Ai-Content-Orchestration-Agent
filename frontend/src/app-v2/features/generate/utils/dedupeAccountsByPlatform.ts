import type { SocialAccount } from "../../social-media/social-accounts.types";
import { SocialPlatform } from "../../content-posts/content-posts.types";

/** One account per platform for Quick Generate (newest connection wins). */
export function dedupeAccountsByPlatform(accounts: SocialAccount[]): SocialAccount[] {
  const byPlatform = new Map<SocialPlatform, SocialAccount>();

  for (const account of accounts) {
    const existing = byPlatform.get(account.platform);
    if (!existing || account.id > existing.id) {
      byPlatform.set(account.platform, account);
    }
  }

  return [...byPlatform.values()];
}

export function getAccountsForPlatform(accounts: SocialAccount[], platform: SocialPlatform): SocialAccount[] {
  return accounts
    .filter((account) => account.platform === platform)
    .sort((a, b) => b.id - a.id);
}
