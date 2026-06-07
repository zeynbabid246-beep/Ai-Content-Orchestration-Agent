import { useCallback, useMemo, useState } from "react";
import {
  formatAiError,
  generateCampaignContent,
  generateCampaignPlanning,
  generateCampaignStrategy,
} from "../../ai/ai.api";
import { bulkCreateCampaignPosts } from "../campaigns.api";
import {
  buildPipelineConfig,
  defaultStrategyConfig,
  type CampaignStrategyConfig,
} from "../components/CampaignStrategyConfigForm";
import type { AiPlanningProfile, AiStrategyProfile } from "../lib/campaignAi.types";
import type { ReviewPost } from "../components/CampaignPostReviewList";

export type AiPipelineStep = "configure" | "strategy" | "planning" | "content" | "confirm";

const STEPS: AiPipelineStep[] = ["configure", "strategy", "planning", "content", "confirm"];

export function useCampaignAiPipeline(channelId: number, connectedPlatforms: string[]) {
  const [activeStep, setActiveStep] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [strategyConfig, setStrategyConfig] = useState<CampaignStrategyConfig>(() =>
    defaultStrategyConfig("", "")
  );
  const [strategyProfile, setStrategyProfile] = useState<AiStrategyProfile | null>(null);
  const [strategyId, setStrategyId] = useState<number | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [planningProfile, setPlanningProfile] = useState<AiPlanningProfile | null>(null);
  const [planningId, setPlanningId] = useState<number | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[activeStep];

  const pipelineConfig = useCallback(
    () => buildPipelineConfig(channelId, strategyConfig, startDate, endDate, connectedPlatforms),
    [channelId, strategyConfig, startDate, endDate, connectedPlatforms]
  );

  const contentDirections = useMemo(
    () => strategyProfile?.content_direction ?? [],
    [strategyProfile]
  );

  const canConfigure =
    strategyConfig.theme.trim().length > 0 && Boolean(startDate) && Boolean(endDate);

  const canAdvance = (() => {
    switch (currentStep) {
      case "configure":
        return canConfigure;
      case "strategy":
        return Boolean(strategyProfile) && Boolean(selectedDirection);
      case "planning":
        return Boolean(planningProfile);
      case "content":
        return posts.length > 0;
      case "confirm":
        return posts.length > 0;
      default:
        return false;
    }
  })();

  const goNext = () => setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const initConfig = (brandOrgId: string, theme: string) => {
    setStrategyConfig((prev) => ({
      ...prev,
      orgId: brandOrgId,
      theme: prev.theme || theme,
    }));
  };

  const runStrategy = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await generateCampaignStrategy(pipelineConfig());
      const profile = result.strategy as AiStrategyProfile;
      if (result.strategyId) profile.strategy_id = result.strategyId;
      setStrategyProfile(profile);
      setStrategyId(result.strategyId);
      setSelectedDirection(null);
      setPlanningProfile(null);
      setPlanningId(null);
      setPosts([]);
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const runPlanning = async () => {
    if (!strategyProfile || !strategyId) return;
    setBusy(true);
    setError(null);
    try {
      const direction =
        selectedDirection ?? strategyProfile.content_direction?.[0] ?? undefined;
      const result = await generateCampaignPlanning({
        config: pipelineConfig(),
        strategyId,
        strategy: strategyProfile,
        selectedContentDirection: direction,
        directionMode: "single",
      });
      const profile = result.planning as AiPlanningProfile;
      if (result.planningId) profile.planning_id = result.planningId;
      setPlanningProfile(profile);
      setPlanningId(result.planningId);
      setPosts([]);
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const runContent = async () => {
    if (!strategyProfile || !strategyId || !planningProfile || !planningId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateCampaignContent({
        config: pipelineConfig(),
        strategyId,
        strategy: strategyProfile,
        planningId,
        planning: planningProfile,
      });
      setPosts(
        result.posts.map((p) => ({
          title: p.title,
          contentJson: p.contentJson,
          contentType: p.contentType,
          scheduledAt: p.scheduledAt,
          platform: p.platform,
        }))
      );
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const finalize = async (
    campaignId: number,
    options?: {
      schedulePosts?: boolean;
      accountByPlatform?: Record<string, number>;
    }
  ) => {
    setBusy(true);
    setError(null);
    try {
      await bulkCreateCampaignPosts(
        campaignId,
        posts.map((p) => ({
          title: p.title,
          contentJson: p.contentJson,
          contentType: p.contentType,
          scheduledAt: options?.schedulePosts ? p.scheduledAt : undefined,
          platform: p.platform,
          socialAccountId:
            options?.schedulePosts && options.accountByPlatform?.[p.platform]
              ? options.accountByPlatform[p.platform]
              : undefined,
        }))
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create posts.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    activeStep,
    currentStep,
    steps: STEPS,
    busy,
    error,
    setError,
    canConfigure,
    canAdvance,
    goNext,
    goBack,

    startDate,
    setStartDate,
    endDate,
    setEndDate,
    strategyConfig,
    setStrategyConfig,
    initConfig,

    strategyProfile,
    setStrategyProfile,
    strategyId,
    contentDirections,
    selectedDirection,
    setSelectedDirection,
    runStrategy,

    planningProfile,
    setPlanningProfile,
    planningId,
    runPlanning,

    posts,
    setPosts,
    runContent,

    finalize,
  };
}
