import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Channel, CreateChannelRequest } from "../channels.types";

const TONE_OPTIONS = [
  { value: "", label: "Use brand default" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "playful", label: "Playful" },
  { value: "authoritative", label: "Authoritative" },
  { value: "educational", label: "Educational" },
];

const GOAL_OPTIONS = [
  { value: "", label: "Use brand default" },
  { value: "growth", label: "Growth & acquisition" },
  { value: "recruitment", label: "Recruitment & employer brand" },
  { value: "education", label: "Education & thought leadership" },
  { value: "support", label: "Customer support & community" },
  { value: "brand", label: "Brand awareness" },
];

const COLOR_OPTIONS = [
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#db2777",
  "#0A66C2",
  "#1877F2",
  "#f59e0b",
];

interface CreateChannelDialogProps {
  open: boolean;
  initial?: Channel | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateChannelRequest) => void;
}

type InnerDialogProps = Omit<CreateChannelDialogProps, "open">;

function goalFromConfig(config?: Channel["config"]): string {
  if (!config?.settingsJson) return "";
  try {
    const parsed = JSON.parse(config.settingsJson) as { goal?: string };
    return parsed.goal ?? "";
  } catch {
    return "";
  }
}

function CreateChannelDialogInner({
  initial,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: InnerDialogProps) {
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tone, setTone] = useState(initial?.branding?.tone ?? "");
  const [goal, setGoal] = useState(
    initial?.branding?.goal ?? goalFromConfig(initial?.config)
  );
  const [color, setColor] = useState(
    initial?.branding?.theme && COLOR_OPTIONS.includes(initial.branding.theme)
      ? initial.branding.theme
      : COLOR_OPTIONS[0]
  );

  const canSubmit = name.trim().length >= 2 && !saving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      branding: {
        tone: tone || undefined,
        theme: color,
        goal: goal || undefined,
      },
      config: {
        settingsJson: JSON.stringify({
          ...(goal ? { goal } : {}),
          timezone: "UTC",
        }),
      },
    });
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.4 }}>
          {isEdit ? "Edit channel" : "New channel"}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25 }}>
          {isEdit ? `Update ${initial?.name}` : "Set up a publishing workspace"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Channels group campaigns, branding, social accounts, and publishing configuration.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.25} sx={{ mt: 0.5 }}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <TextField
            label="Name"
            placeholder="e.g. Product & Growth, Recruitment, Education"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            required
            autoFocus
            helperText="A clear operational name. You can change this later."
          />

          <TextField
            label="Description"
            placeholder="Short description of what this channel publishes."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Tone of voice"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              fullWidth
            >
              {TONE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Operational goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              fullWidth
            >
              {GOAL_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: 1, display: "block", mb: 1 }}
            >
              ACCENT COLOR
            </Typography>
            <Stack direction="row" spacing={1.25}>
              {COLOR_OPTIONS.map((value) => {
                const selected = value === color;
                return (
                  <Box
                    key={value}
                    role="button"
                    tabIndex={0}
                    aria-label={`Pick color ${value}`}
                    onClick={() => setColor(value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setColor(value);
                      }
                    }}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      bgcolor: value,
                      cursor: "pointer",
                      transition: "transform 0.12s",
                      border: "2px solid",
                      borderColor: selected ? "common.white" : "transparent",
                      boxShadow: selected ? `0 0 0 2px ${value}` : "none",
                      "&:hover": { transform: "scale(1.08)" },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create channel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CreateChannelDialog(props: CreateChannelDialogProps) {
  if (!props.open) return null;
  // Mount fresh on every open to reset internal state without an effect.
  return <CreateChannelDialogInner {...props} />;
}
