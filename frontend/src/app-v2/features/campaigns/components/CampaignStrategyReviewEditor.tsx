import { Stack, TextField, Typography } from "@mui/material";
import type { AiStrategyProfile } from "../lib/campaignAi.types";

interface CampaignStrategyReviewEditorProps {
  strategy: AiStrategyProfile;
  onChange: (strategy: AiStrategyProfile) => void;
  disabled?: boolean;
}

export function CampaignStrategyReviewEditor({
  strategy,
  onChange,
  disabled = false,
}: CampaignStrategyReviewEditorProps) {
  const guidelines = strategy.content_guidelines ?? {};

  const set = (patch: Partial<AiStrategyProfile>) => onChange({ ...strategy, ...patch });

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Strategy overview</Typography>
      <Typography variant="caption" color="text.secondary">
        Edit the AI strategy before generating the content calendar (planning).
      </Typography>
      <TextField
        label="Strategy summary"
        value={strategy.strategy_summary ?? ""}
        onChange={(e) => set({ strategy_summary: e.target.value })}
        multiline
        minRows={3}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Positioning"
        value={strategy.positioning ?? ""}
        onChange={(e) => set({ positioning: e.target.value })}
        multiline
        minRows={2}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Target audience"
        value={strategy.target_audience ?? ""}
        onChange={(e) => set({ target_audience: e.target.value })}
        multiline
        minRows={2}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Content pillars (comma-separated)"
        value={(strategy.pillars ?? []).join(", ")}
        onChange={(e) =>
          set({
            pillars: e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Angles (comma-separated)"
        value={(strategy.angles ?? []).join(", ")}
        onChange={(e) =>
          set({
            angles: e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        fullWidth
        disabled={disabled}
      />
      <Typography variant="caption" color="text.secondary">
        Content guidelines
      </Typography>
      <TextField
        label="Tone"
        size="small"
        value={guidelines.tone ?? ""}
        onChange={(e) =>
          set({
            content_guidelines: { ...guidelines, tone: e.target.value },
          })
        }
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Style"
        size="small"
        value={guidelines.style ?? ""}
        onChange={(e) =>
          set({
            content_guidelines: { ...guidelines, style: e.target.value },
          })
        }
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="CTA style"
        size="small"
        value={guidelines.cta_style ?? ""}
        onChange={(e) =>
          set({
            content_guidelines: { ...guidelines, cta_style: e.target.value },
          })
        }
        fullWidth
        disabled={disabled}
      />
      <TextField
        label="Content direction (one per line)"
        value={(strategy.content_direction ?? []).join("\n")}
        onChange={(e) =>
          set({
            content_direction: e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        multiline
        minRows={3}
        fullWidth
        disabled={disabled}
      />
    </Stack>
  );
}
