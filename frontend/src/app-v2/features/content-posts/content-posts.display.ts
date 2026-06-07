import { ContentStatus, type ContentPost } from "./content-posts.types";

export type ContentDisplayStatus = "Draft" | "Scheduled" | "Published" | "Deleted";

export function getEffectiveContentStatus(
  post: Pick<ContentPost, "status" | "scheduledAt" | "publishedAt">
): ContentStatus {
  if (post.status === ContentStatus.Deleted) return ContentStatus.Deleted;
  if (post.publishedAt) return ContentStatus.Published;
  if (post.scheduledAt) return ContentStatus.Scheduled;
  return post.status;
}

export function toDisplayStatus(status: ContentStatus): ContentDisplayStatus {
  switch (status) {
    case ContentStatus.Ready:
    case ContentStatus.Draft:
      return "Draft";
    case ContentStatus.Scheduled:
      return "Scheduled";
    case ContentStatus.Published:
      return "Published";
    case ContentStatus.Deleted:
      return "Deleted";
    default:
      return "Draft";
  }
}

export function toPostDisplayStatus(
  post: Pick<ContentPost, "status" | "scheduledAt" | "publishedAt">
): ContentDisplayStatus {
  return toDisplayStatus(getEffectiveContentStatus(post));
}

export function matchesDisplayFilter(
  status: ContentStatus,
  filter: ContentDisplayStatus | "all"
): boolean {
  if (filter === "all") return status !== ContentStatus.Deleted;
  return toDisplayStatus(status) === filter;
}

export function matchesPostDisplayFilter(
  post: Pick<ContentPost, "status" | "scheduledAt" | "publishedAt">,
  filter: ContentDisplayStatus | "all"
): boolean {
  return matchesDisplayFilter(getEffectiveContentStatus(post), filter);
}

export const CONTENT_DISPLAY_FILTERS: { value: ContentDisplayStatus; label: string }[] = [
  { value: "Draft", label: "Drafts" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Published", label: "Published" },
];
