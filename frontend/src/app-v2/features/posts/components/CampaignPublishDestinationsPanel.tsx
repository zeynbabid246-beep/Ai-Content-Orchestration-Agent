import { useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CalendarClock, Send } from "lucide-react";
import { SocialPlatform, type ContentPostVariant } from "../../content-posts/content-posts.types";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import type { PlatformPublishState } from "../hooks/useMultiPlatformPublish";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "../utils/variantPreview";
import { getAccountsForPlatform } from "../../generate/utils/dedupeAccountsByPlatform";
import {
  getReadyPlatforms,
  minDatetimeLocalValue,
  variantHasContent,
} from "../utils/publishReadiness";

interface CampaignPublishDestinationsPanelProps {
  saveRequired: boolean;
  readOnly: boolean;
  workflowReady: boolean;
  isPublished: boolean;
  selectedPlatforms: SocialPlatform[];
  variants: ContentPostVariant[];
  channelAccounts: SocialAccount[];
  selectedByPlatform: Partial<Record<SocialPlatform, number>>;
  onSelectedByPlatformChange: (value: Partial<Record<SocialPlatform, number>>) => void;
  platformPublishState: Partial<Record<SocialPlatform, PlatformPublishState>>;
  platformPublishErrors: Partial<Record<SocialPlatform, string>>;
  imageUrl: string | null;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  isPublishing: boolean;
  onPublish: () => void;
  onSchedule: () => void;
  message?: { severity: "info" | "success" | "warning" | "error"; text: string } | null;
}

function statusLabel(state: PlatformPublishState | undefined): string | null {
  switch (state) {
    case "queued":
      return "Queued…";
    case "publishing":
      return "Publishing…";
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

export function CampaignPublishDestinationsPanel({
  saveRequired,
  readOnly,
  workflowReady,
  isPublished,
  selectedPlatforms,
  variants,
  channelAccounts,
  selectedByPlatform,
  onSelectedByPlatformChange,
  platformPublishState,
  platformPublishErrors,
  imageUrl,
  scheduledAt,
  onScheduledAtChange,
  isPublishing,
  onPublish,
  onSchedule,
  message,
}: CampaignPublishDestinationsPanelProps) {
  const theme = useTheme();
  const accent = theme.palette.warning.main;
  const minScheduleAt = useMemo(() => minDatetimeLocalValue(5), []);

  const readyPlatforms = useMemo(
    () => getReadyPlatforms(selectedPlatforms, variants, channelAccounts, imageUrl),
    [selectedPlatforms, variants, channelAccounts, imageUrl]
  );

  const readyWithAccount = readyPlatforms.filter(
    (platform) => selectedByPlatform[platform] != null
  );

  const controlsLocked = readOnly || saveRequired || !workflowReady || isPublished;

  const canSchedule =
    !controlsLocked && readyPlatforms.length > 0 && Boolean(scheduledAt.trim());

  const canPublishNow =
    canSchedule && readyWithAccount.length === readyPlatforms.length;

  useEffect(() => {
    const next = { ...selectedByPlatform };
    let changed = false;
    for (const platform of selectedPlatforms) {
      const accounts = getAccountsForPlatform(channelAccounts, platform);
      if (accounts.length === 1 && next[platform] !== accounts[0].id) {
        next[platform] = accounts[0].id;
        changed = true;
      }
    }
    if (changed) {
      onSelectedByPlatformChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-fill when platforms/accounts change
  }, [selectedPlatforms, channelAccounts]);

  const scheduleHint = (() => {
    if (saveRequired) return "Save the post draft before scheduling or publishing.";
    if (!workflowReady) return "Approve the post (Review → Approved) to unlock scheduling.";
    if (isPublished) return "This post is already published.";
    if (selectedPlatforms.length === 0) return "Select target platforms above.";
    if (readyPlatforms.length === 0) {
      return "Add variant copy (and an image for Instagram) for at least one selected platform.";
    }
    if (!scheduledAt.trim()) return "Pick a date and time to enable Schedule all.";
    if (readyWithAccount.length < readyPlatforms.length) {
      return "Select a publishing account for each ready platform.";
    }
    return null;
  })();

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
          Publish &amp; schedule
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Publish now or schedule for later on all ready platforms with linked accounts.
      </Typography>

      {saveRequired ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Save the post draft first — then you can schedule or publish.
        </Alert>
      ) : null}

      {isPublished ? (
        <Alert severity="success" sx={{ mb: 1.5 }}>
          This post is marked as published. Create a new post to schedule again.
        </Alert>
      ) : null}

      {!workflowReady && !saveRequired && !isPublished ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Move through Review → Approved before scheduling or publishing.
        </Alert>
      ) : null}

      {selectedPlatforms.length === 0 && !saveRequired ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Select target platforms above to configure publishing.
        </Alert>
      ) : null}

      {message ? (
        <Alert severity={message.severity} sx={{ mb: 1.5 }}>
          {message.text}
        </Alert>
      ) : null}

      {isPublishing ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

      <Stack spacing={1.5}>
        {selectedPlatforms.map((platform) => {
          const accounts = getAccountsForPlatform(channelAccounts, platform);
          const color = PLATFORM_COLORS[platform];
          const variant = variants.find((v) => v.platform === platform);
          const hasContent = variantHasContent(variant);
          const needsImage = platform === SocialPlatform.Instagram && !imageUrl;
          const isReady = readyPlatforms.includes(platform);
          const state = platformPublishState[platform];
          const err = platformPublishErrors[platform];
          const status = statusLabel(state);

          if (accounts.length === 0) {
            return (
              <Alert key={platform} severity="warning" sx={{ py: 0.5 }}>
                {PLATFORM_LABELS[platform]}: link an account on Channel → Publishing.
              </Alert>
            );
          }

          return (
            <Box
              key={platform}
              sx={{
                p: 1.25,
                borderRadius: 1,
                border: "1px solid",
                borderColor: alpha(color, isReady ? 0.35 : 0.15),
                bgcolor: alpha(color, isReady ? 0.04 : 0.02),
                opacity: isReady ? 1 : 0.85,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" fontWeight={600} sx={{ color }}>
                  {PLATFORM_LABELS[platform]}
                  {!isReady ? (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                      (not ready)
                    </Typography>
                  ) : null}
                </Typography>
                {status ? (
                  <Typography
                    variant="caption"
                    color={
                      state === "failed"
                        ? "error"
                        : state === "published" || state === "scheduled"
                          ? "success.main"
                          : "text.secondary"
                    }
                  >
                    {status}
                  </Typography>
                ) : null}
              </Stack>

              {!hasContent ? (
                <Typography variant="caption" color="error">
                  Add variant copy before publishing.
                </Typography>
              ) : null}
              {needsImage ? (
                <Typography variant="caption" color="error">
                  Instagram requires a shared image on the post.
                </Typography>
              ) : null}

              {accounts.length === 1 ? (
                <Typography variant="caption" color="text.secondary">
                  {accounts[0].displayName || accounts[0].accountHandle}
                </Typography>
              ) : (
                <RadioGroup
                  value={selectedByPlatform[platform] ?? ""}
                  onChange={(e) =>
                    onSelectedByPlatformChange({
                      ...selectedByPlatform,
                      [platform]: Number(e.target.value),
                    })
                  }
                >
                  {accounts.map((account) => (
                    <FormControlLabel
                      key={account.id}
                      value={account.id}
                      control={<Radio size="small" />}
                      label={account.displayName || account.accountHandle}
                      disabled={controlsLocked}
                    />
                  ))}
                </RadioGroup>
              )}

              {err ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {err}
                </Typography>
              ) : null}
            </Box>
          );
        })}

        <TextField
          size="small"
          type="datetime-local"
          label="Schedule date & time"
          value={scheduledAt}
          onChange={(e) => onScheduledAtChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minScheduleAt }}
          disabled={controlsLocked}
          fullWidth
          helperText="Optional — pick a future time, then use Schedule all"
        />

        {scheduleHint ? (
          <Typography variant="caption" color="text.secondary">
            {scheduleHint}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<CalendarClock size={14} />}
            onClick={onSchedule}
            disabled={isPublishing || !canSchedule}
          >
            Schedule all
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="small"
            color="warning"
            startIcon={<Send size={14} />}
            onClick={onPublish}
            disabled={isPublishing || !canPublishNow}
          >
            Publish all
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
