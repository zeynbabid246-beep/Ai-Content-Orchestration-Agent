import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CalendarClock, Send } from "lucide-react";
import type { SocialAccount } from "../../social-media/social-accounts.types";

interface PublishingOptionsPanelProps {
  disabled: boolean;
  workflowReady: boolean;
  publishedAt: string | null | undefined;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  selectedAccountId: number | "";
  onSelectedAccountIdChange: (value: number | "") => void;
  accounts: SocialAccount[];
  onSchedule: () => void;
  onPublishNow: () => void;
  busy: boolean;
  message?: { severity: "info" | "success" | "warning" | "error"; text: string } | null;
}

export function PublishingOptionsPanel({
  disabled,
  workflowReady,
  publishedAt,
  scheduledAt,
  onScheduledAtChange,
  selectedAccountId,
  onSelectedAccountIdChange,
  accounts,
  onSchedule,
  onPublishNow,
  busy,
  message,
}: PublishingOptionsPanelProps) {
  const theme = useTheme();
  const accent = theme.palette.warning.main;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: 0.75,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(accent, 0.18),
            color: accent,
          }}
        >
          <CalendarClock size={12} />
        </Box>
        <Typography variant="subtitle2" fontWeight={600}>
          Publishing options
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Publish now or schedule for a future date.
      </Typography>

      {publishedAt ? (
        <Alert severity="success" sx={{ mb: 1.5 }}>
          Already published on {new Date(publishedAt).toLocaleString()}.
        </Alert>
      ) : null}

      {!workflowReady && !publishedAt ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Finish editing the post before scheduling or publishing.
        </Alert>
      ) : null}

      {message ? (
        <Alert severity={message.severity} sx={{ mb: 1.5 }}>
          {message.text}
        </Alert>
      ) : null}

      <Stack spacing={1.5}>
        <TextField
          select
          size="small"
          label="Publish via account"
          value={selectedAccountId}
          onChange={(event) =>
            onSelectedAccountIdChange(
              event.target.value === "" ? "" : Number(event.target.value)
            )
          }
          disabled={disabled || accounts.length === 0}
          helperText={
            accounts.length === 0
              ? "No connected accounts in this channel. Connect one from the Publishing tab."
              : undefined
          }
        >
          {accounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.platform} — {account.displayName || account.accountHandle}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          type="datetime-local"
          label="Schedule date"
          value={scheduledAt}
          onChange={(event) => onScheduledAtChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={disabled || !workflowReady}
        />

        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<CalendarClock size={14} />}
            onClick={onSchedule}
            disabled={busy || disabled || !workflowReady || !scheduledAt || !selectedAccountId}
          >
            Schedule
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="small"
            color="warning"
            startIcon={<Send size={14} />}
            onClick={onPublishNow}
            disabled={busy || disabled || !workflowReady || !selectedAccountId}
          >
            Publish
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
