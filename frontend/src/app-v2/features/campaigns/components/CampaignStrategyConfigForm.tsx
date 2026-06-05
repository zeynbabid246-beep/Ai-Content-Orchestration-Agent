import {
  Grid,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export const CAMPAIGN_GOAL_OPTIONS = [
  "engagement",
  "awareness",
  "leads",
  "community",
  "authority",
] as const;

export const CAMPAIGN_LANGUAGE_OPTIONS = ["English", "French", "Arabic"] as const;

export type CampaignGoalOption = (typeof CAMPAIGN_GOAL_OPTIONS)[number];
export type CampaignLanguageOption = (typeof CAMPAIGN_LANGUAGE_OPTIONS)[number];

export interface CampaignStrategyConfig {
  orgId: string;
  goal: CampaignGoalOption;
  postsPerWeek: number;
  theme: string;
  language: CampaignLanguageOption;
  customPrompt: string;
}

interface CampaignStrategyConfigFormProps {
  value: CampaignStrategyConfig;
  onChange: (value: CampaignStrategyConfig) => void;
  disabled?: boolean;
  /** Scraped org_id from Brand Studio — not editable */
  lockedOrgId?: string;
}

export function CampaignStrategyConfigForm({
  value,
  onChange,
  disabled = false,
  lockedOrgId,
}: CampaignStrategyConfigFormProps) {
  const orgId = lockedOrgId ?? value.orgId;
  const set = <K extends keyof CampaignStrategyConfig>(key: K, v: CampaignStrategyConfig[K]) => {
    if (key === "orgId") return;
    onChange({ ...value, orgId, [key]: v });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Strategy configuration</Typography>
      <Typography variant="caption" color="text.secondary">
        Matches the AI Strategy Studio inputs (brand, goal, theme, language, posting cadence).
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Brand ID"
            value={orgId}
            fullWidth
            size="small"
            disabled
            InputProps={{ readOnly: true }}
            helperText="Locked to scraped Brand Studio org_id (used by the AI service)"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            label="Goal"
            value={value.goal}
            onChange={(e) => set("goal", e.target.value as CampaignGoalOption)}
            fullWidth
            size="small"
            disabled={disabled}
          >
            {CAMPAIGN_GOAL_OPTIONS.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Posts per week: {value.postsPerWeek}
          </Typography>
          <Slider
            min={2}
            max={7}
            step={1}
            marks
            value={value.postsPerWeek}
            onChange={(_, v) => set("postsPerWeek", v as number)}
            disabled={disabled}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Theme"
            value={value.theme}
            onChange={(e) => set("theme", e.target.value)}
            fullWidth
            size="small"
            disabled={disabled}
            placeholder="e.g. digital transformation, cloud and AI"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            label="Language"
            value={value.language}
            onChange={(e) => set("language", e.target.value as CampaignLanguageOption)}
            fullWidth
            size="small"
            disabled={disabled}
          >
            {CAMPAIGN_LANGUAGE_OPTIONS.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Campaign direction"
            value={value.customPrompt}
            onChange={(e) => set("customPrompt", e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={disabled}
            placeholder="Optional: tone, audience, content angles, launch focus..."
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

export function defaultStrategyConfig(
  orgId = "",
  theme = ""
): CampaignStrategyConfig {
  return {
    orgId,
    goal: "engagement",
    postsPerWeek: 4,
    theme,
    language: "English",
    customPrompt: "",
  };
}

export function buildPipelineConfig(
  channelId: number,
  config: CampaignStrategyConfig,
  startDate: string,
  endDate: string,
  platforms: string[]
) {
  return {
    channelId,
    goal: config.goal,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    platforms,
    theme: config.theme.trim(),
    language: config.language,
    postsPerWeek: config.postsPerWeek,
    customPrompt: config.customPrompt.trim() || undefined,
    primaryPlatform: platforms[0]?.toLowerCase(),
  };
}

/** @deprecated use buildPipelineConfig — org_id is resolved server-side */
export function buildAiCampaignPayload(
  channelId: number,
  config: CampaignStrategyConfig,
  startDate: string,
  endDate: string,
  platforms: string[]
) {
  return buildPipelineConfig(channelId, config, startDate, endDate, platforms);
}
