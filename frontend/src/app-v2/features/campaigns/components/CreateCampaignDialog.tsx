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
import { CampaignStatus, type Campaign, type CreateCampaignRequest } from "../campaigns.types";

const OBJECTIVE_OPTIONS = [
  { value: "", label: "Use brand default" },
  { value: "awareness", label: "Awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "conversion", label: "Conversion" },
  { value: "retention", label: "Retention" },
  { value: "recruitment", label: "Recruitment" },
];

interface CreateCampaignDialogProps {
  open: boolean;
  channelId: number;
  channelName?: string;
  initial?: Campaign | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateCampaignRequest) => void;
}

type InnerDialogProps = Omit<CreateCampaignDialogProps, "open">;

function CreateCampaignDialogInner({
  channelId,
  channelName,
  initial,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: InnerDialogProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [objective, setObjective] = useState(initial?.objective ?? "");
  const [toneOfVoice, setToneOfVoice] = useState(initial?.toneOfVoiceOverride ?? "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudienceOverride ?? "");
  const [status, setStatus] = useState<CampaignStatus>(initial?.status ?? CampaignStatus.Draft);

  const canSubmit = name.trim().length >= 2 && !saving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const objectivePrefix = description.trim()
      ? description.trim()
      : `Objective: ${objective}`;
    onSubmit({
      name: name.trim(),
      description: objectivePrefix || undefined,
      channelId,
      status,
      objective: objective || undefined,
      toneOfVoiceOverride: toneOfVoice || undefined,
      targetAudienceOverride: targetAudience || undefined,
    });
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.4 }}>
          {isEdit ? "Edit campaign" : "New campaign"}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.25 }}>
          {isEdit ? `Update ${initial?.name}` : "Start a campaign"}
        </Typography>
        {channelName ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Inside channel <strong>{channelName}</strong>
          </Typography>
        ) : null}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.25} sx={{ mt: 0.5 }}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <TextField
            label="Name"
            placeholder="e.g. Q3 product launch, Senior engineering hiring"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Description / brief"
            placeholder="Short description, target audience, key messaging..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Objective"
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              fullWidth
            >
              {OBJECTIVE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Initial status"
              value={status}
              onChange={(event) => setStatus(event.target.value as CampaignStatus)}
              fullWidth
            >
              <MenuItem value={CampaignStatus.Draft}>Draft</MenuItem>
              <MenuItem value={CampaignStatus.Active}>Active</MenuItem>
              <MenuItem value={CampaignStatus.Paused}>Paused</MenuItem>
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Tone override"
              value={toneOfVoice}
              onChange={(event) => setToneOfVoice(event.target.value)}
              fullWidth
              helperText="Optional campaign-specific voice override."
            />
            <TextField
              label="Target audience override"
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
              fullWidth
              helperText="Optional campaign-specific audience override."
            />
          </Stack>

          <Box
            sx={{
              p: 1.5,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              You can add posts, variants and publishing accounts after the campaign is created.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create campaign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CreateCampaignDialog(props: CreateCampaignDialogProps) {
  if (!props.open) return null;
  return <CreateCampaignDialogInner {...props} />;
}
