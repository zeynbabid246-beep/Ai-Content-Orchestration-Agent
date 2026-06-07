import type { CampaignPostSummary } from "./campaigns.types";
import { ContentStatus, type ContentPost } from "../content-posts/content-posts.types";
import { getEffectiveContentStatus, toDisplayStatus } from "../content-posts/content-posts.display";

export function formatCampaignProgress(summary?: CampaignPostSummary | null): string | null {
  if (!summary) return null;

  const parts: string[] = [];
  if (summary.draftCount > 0) {
    parts.push(`${summary.draftCount} draft${summary.draftCount === 1 ? "" : "s"}`);
  }
  if (summary.scheduledCount > 0) {
    parts.push(`${summary.scheduledCount} scheduled`);
  }
  if (summary.publishedCount > 0) {
    parts.push(`${summary.publishedCount} published`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildPostSummaryFromPosts(
  posts: Array<Pick<ContentPost, "status" | "scheduledAt" | "publishedAt">>
): CampaignPostSummary {
  const summary: CampaignPostSummary = {
    draftCount: 0,
    scheduledCount: 0,
    publishedCount: 0,
  };

  for (const post of posts) {
    if (post.status === ContentStatus.Deleted) continue;
    const display = toDisplayStatus(getEffectiveContentStatus(post));
    if (display === "Draft") summary.draftCount++;
    else if (display === "Scheduled") summary.scheduledCount++;
    else if (display === "Published") summary.publishedCount++;
  }

  return summary;
}

export function resolveCampaignPostSummary(
  campaignSummary: CampaignPostSummary | null | undefined,
  fallbackPosts?: Array<Pick<ContentPost, "status" | "scheduledAt" | "publishedAt">>
): CampaignPostSummary {
  if (campaignSummary) return campaignSummary;
  if (fallbackPosts) return buildPostSummaryFromPosts(fallbackPosts);
  return { draftCount: 0, scheduledCount: 0, publishedCount: 0 };
}
