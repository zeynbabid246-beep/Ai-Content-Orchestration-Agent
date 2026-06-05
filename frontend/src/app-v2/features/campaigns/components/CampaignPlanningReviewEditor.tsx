import {
  Box,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AiPlanningProfile, AiPlanningWeek } from "../lib/campaignAi.types";

const CONTENT_TYPES = ["Carousel", "Static Image", "Text Post", "Infographic"];

interface CampaignPlanningReviewEditorProps {
  planning: AiPlanningProfile;
  onChange: (planning: AiPlanningProfile) => void;
  disabled?: boolean;
}

export function CampaignPlanningReviewEditor({
  planning,
  onChange,
  disabled = false,
}: CampaignPlanningReviewEditorProps) {
  const weeks = planning.weeks ?? [];

  const updateWeeks = (nextWeeks: AiPlanningWeek[]) => {
    onChange({ ...planning, weeks: nextWeeks });
  };

  const updateWeek = (weekIndex: number, patch: Partial<AiPlanningWeek>) => {
    const next = weeks.map((w, i) => (i === weekIndex ? { ...w, ...patch } : w));
    updateWeeks(next);
  };

  const updateDay = (
    weekIndex: number,
    dayIndex: number,
    patch: Partial<AiPlanningWeek["days"][number]>
  ) => {
    const week = weeks[weekIndex];
    if (!week) return;
    const days = week.days.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d));
    updateWeek(weekIndex, { days });
  };

  if (weeks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No planning weeks yet. Generate planning from the strategy step.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Content planning</Typography>
      <Typography variant="caption" color="text.secondary">
        Calendar skeleton (topic, format, description) — full copy is generated in the next step.
      </Typography>
      {weeks.map((week, weekIndex) => (
        <Paper key={weekIndex} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Week {week.week}</Typography>
            <TextField
              label="Week focus"
              size="small"
              value={week.focus ?? ""}
              onChange={(e) => updateWeek(weekIndex, { focus: e.target.value })}
              fullWidth
              disabled={disabled}
            />
            {week.days.map((day, dayIndex) => (
              <Box
                key={dayIndex}
                sx={{
                  pl: 1,
                  borderLeft: "2px solid",
                  borderColor: "divider",
                }}
              >
                <Stack spacing={1} sx={{ py: 1 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label="Day"
                      size="small"
                      value={day.day}
                      onChange={(e) => updateDay(weekIndex, dayIndex, { day: e.target.value })}
                      sx={{ minWidth: 120 }}
                      disabled={disabled}
                    />
                    <TextField
                      label="Topic"
                      size="small"
                      value={day.topic}
                      onChange={(e) => updateDay(weekIndex, dayIndex, { topic: e.target.value })}
                      fullWidth
                      disabled={disabled}
                    />
                  </Stack>
                  <TextField
                    select
                    label="Content type"
                    size="small"
                    value={day.content_type || "Text Post"}
                    onChange={(e) =>
                      updateDay(weekIndex, dayIndex, { content_type: e.target.value })
                    }
                    fullWidth
                    disabled={disabled}
                  >
                    {CONTENT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Description"
                    size="small"
                    value={day.description}
                    onChange={(e) =>
                      updateDay(weekIndex, dayIndex, { description: e.target.value })
                    }
                    multiline
                    minRows={2}
                    fullWidth
                    disabled={disabled}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
