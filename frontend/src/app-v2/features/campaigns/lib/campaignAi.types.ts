/** Strategy step output from /api/strategy/generate */
export type AiStrategyProfile = {
  strategy_id?: number;
  strategy_summary?: string;
  positioning?: string;
  target_audience?: string;
  pillars?: string[];
  angles?: string[];
  content_guidelines?: {
    tone?: string;
    style?: string;
    cta_style?: string;
  };
  content_direction?: string[];
  [key: string]: unknown;
};

export type AiPlanningDay = {
  day: string;
  topic: string;
  content_type: string;
  description: string;
};

export type AiPlanningWeek = {
  week: number;
  focus?: string;
  days: AiPlanningDay[];
};

export type AiPlanningProfile = {
  planning_id?: number;
  weeks: AiPlanningWeek[];
  [key: string]: unknown;
};

export type CampaignAiPipelineConfig = {
  channelId: number;
  goal: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  theme: string;
  language: string;
  postsPerWeek: number;
  customPrompt?: string;
  primaryPlatform?: string;
};
