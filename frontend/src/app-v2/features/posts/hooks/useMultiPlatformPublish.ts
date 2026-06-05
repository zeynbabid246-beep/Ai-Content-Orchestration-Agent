import { useCallback, useState } from "react";
import { SocialPlatform } from "../../content-posts/content-posts.types";
import {
  formatPublicationError,
  publishPublication,
  schedulePublication,
  waitForPublication,
} from "../../content-posts/publications.api";
import type { SocialAccount } from "../../social-media/social-accounts.types";

export type PlatformPublishState =
  | "idle"
  | "queued"
  | "publishing"
  | "published"
  | "scheduled"
  | "failed";

export interface PublishTarget {
  platform: SocialPlatform;
  accountId: number;
}

interface UseMultiPlatformPublishOptions {
  contentPostId: number | null;
}

export function useMultiPlatformPublish({ contentPostId }: UseMultiPlatformPublishOptions) {
  const [platformState, setPlatformState] = useState<Partial<Record<SocialPlatform, PlatformPublishState>>>({});
  const [platformErrors, setPlatformErrors] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  const reset = useCallback(() => {
    setPlatformState({});
    setPlatformErrors({});
  }, []);

  const publishToTargets = useCallback(
    async (targets: PublishTarget[]) => {
      if (!contentPostId || targets.length === 0) {
        throw new Error("Save and approve the post before publishing.");
      }

      setIsPublishing(true);
      const states: Partial<Record<SocialPlatform, PlatformPublishState>> = {};
      const errors: Partial<Record<SocialPlatform, string>> = {};

      for (const target of targets) {
        states[target.platform] = "queued";
        setPlatformState({ ...states });

        try {
          const publication = await publishPublication(contentPostId, {
            socialAccountId: target.accountId,
            postVariantId: null,
            idempotencyKey: `campaign-publish-${contentPostId}-${target.accountId}-${Date.now()}`,
          });

          states[target.platform] = "publishing";
          setPlatformState({ ...states });

          const final = await waitForPublication(publication.id);
          if (final.status === "Published") {
            states[target.platform] = "published";
          } else {
            states[target.platform] = "failed";
            errors[target.platform] = formatPublicationError(final.errorMessage);
          }
        } catch (err) {
          states[target.platform] = "failed";
          errors[target.platform] =
            err instanceof Error ? err.message : "Publish failed";
        }

        setPlatformState({ ...states });
        setPlatformErrors({ ...errors });
      }

      setIsPublishing(false);
      const published = targets.filter((t) => states[t.platform] === "published").length;
      return { published, total: targets.length, states, errors };
    },
    [contentPostId]
  );

  const scheduleToTargets = useCallback(
    async (targets: PublishTarget[], scheduledAtIso: string) => {
      if (!contentPostId || targets.length === 0) {
        throw new Error("Save and approve the post before scheduling.");
      }

      setIsPublishing(true);
      const states: Partial<Record<SocialPlatform, PlatformPublishState>> = {};
      const errors: Partial<Record<SocialPlatform, string>> = {};

      for (const target of targets) {
        states[target.platform] = "queued";
        setPlatformState({ ...states });

        try {
          await schedulePublication(contentPostId, {
            socialAccountId: target.accountId,
            postVariantId: null,
            scheduledAt: scheduledAtIso,
            idempotencyKey: `campaign-schedule-${contentPostId}-${target.accountId}-${scheduledAtIso}`,
          });
          states[target.platform] = "scheduled";
        } catch (err) {
          states[target.platform] = "failed";
          errors[target.platform] =
            err instanceof Error ? err.message : "Schedule failed";
        }

        setPlatformState({ ...states });
        setPlatformErrors({ ...errors });
      }

      setIsPublishing(false);
      const scheduled = targets.filter((t) => states[t.platform] === "scheduled").length;
      return { scheduled, total: targets.length, errors, states };
    },
    [contentPostId]
  );

  return {
    platformState,
    platformErrors,
    isPublishing,
    reset,
    publishToTargets,
    scheduleToTargets,
  };
}

export function resolvePublishTargets(
  selectedPlatforms: SocialPlatform[],
  selectedByPlatform: Partial<Record<SocialPlatform, number>>,
  channelAccounts: SocialAccount[]
): PublishTarget[] {
  const targets: PublishTarget[] = [];
  for (const platform of selectedPlatforms) {
    const accountId = selectedByPlatform[platform];
    const account =
      accountId != null
        ? channelAccounts.find((a) => a.id === accountId)
        : channelAccounts.find((a) => a.platform === platform);
    if (account) {
      targets.push({ platform, accountId: account.id });
    }
  }
  return targets;
}
