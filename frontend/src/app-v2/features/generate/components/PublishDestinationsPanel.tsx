import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import { SocialPlatform } from "../../content-posts/content-posts.types";
import type { QuickVariantDraft } from "../generate.types";
import { getVariantDefinition } from "../utils/variantHelpers";
import { getAccountsForPlatform } from "../utils/dedupeAccountsByPlatform";
const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  [SocialPlatform.LinkedIn]: "LinkedIn",
  [SocialPlatform.Facebook]: "Facebook",
  [SocialPlatform.Instagram]: "Instagram",
  [SocialPlatform.X]: "X",
  [SocialPlatform.Threads]: "Threads",
  [SocialPlatform.TikTok]: "TikTok",
};

export type PlatformPublishState =
  | "idle"
  | "queued"
  | "publishing"
  | "published"
  | "failed";

interface PublishDestinationsPanelProps {
  allAccounts: SocialAccount[];
  enabledPlatforms: SocialPlatform[];
  enabledVariants: QuickVariantDraft[];
  selectedByPlatform: Partial<Record<SocialPlatform, number>>;
  onSelectedByPlatformChange: (value: Partial<Record<SocialPlatform, number>>) => void;
  platformPublishState: Partial<Record<SocialPlatform, PlatformPublishState>>;
  platformPublishErrors: Partial<Record<SocialPlatform, string>>;
  requiresImage: boolean;
  hasImage: boolean;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  onConnectLinkedIn: () => void;
  onConnectFacebook: () => void;
  onConnectInstagram: () => void;
  onConnectThreads: () => void;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule: () => void;
}

function variantReady(variant: QuickVariantDraft): boolean {
  const definition = getVariantDefinition(variant.key);
  if (definition.format === "carousel") {
    return Boolean(variant.body.trim() || variant.slides.some(Boolean));
  }
  return variant.body.trim().length > 0;
}

function statusLabel(state: PlatformPublishState | undefined): string | null {
  switch (state) {
    case "queued":
      return "Queued…";
    case "publishing":
      return "Publishing…";
    case "published":
      return "Published";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

export function PublishDestinationsPanel({
  allAccounts,
  enabledPlatforms,
  enabledVariants,
  selectedByPlatform,
  onSelectedByPlatformChange,
  platformPublishState,
  platformPublishErrors,
  requiresImage,
  hasImage,
  scheduledAt,
  onScheduledAtChange,
  onConnectLinkedIn,
  onConnectFacebook,
  onConnectInstagram,
  onConnectThreads,
  isSubmitting,
  onSaveDraft,
  onPublish,
  onSchedule,
}: PublishDestinationsPanelProps) {
  const theme = useTheme();

  const platformsWithContent = new Set(
    enabledVariants.filter(variantReady).map((v) => getVariantDefinition(v.key).platform)
  );

  const selectedCount = enabledPlatforms.filter((platform) => selectedByPlatform[platform] != null).length;

  const canPublish =
    selectedCount > 0 &&
    enabledPlatforms.every((platform) => {
      if (selectedByPlatform[platform] == null) return true;
      if (!platformsWithContent.has(platform)) return false;
      if (platform === SocialPlatform.Instagram && requiresImage && !hasImage) return false;
      return true;
    });

  const setPlatformAccount = (platform: SocialPlatform, accountId: number) => {
    onSelectedByPlatformChange({ ...selectedByPlatform, [platform]: accountId });
  };

  const clearPlatform = (platform: SocialPlatform) => {
    const next = { ...selectedByPlatform };
    delete next[platform];
    onSelectedByPlatformChange(next);
  };

  if (enabledPlatforms.length === 0) {
    return (
      <Alert severity="info">
        Go back to step 1 and enable at least one platform you want to publish to.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {requiresImage && !hasImage ? (
        <Alert severity="warning">
          Instagram requires an image. Go back to step 2 and add shared media before publishing.
        </Alert>
      ) : null}

      <Stack spacing={1.5}>
        {enabledPlatforms.map((platform) => {
          const label = PLATFORM_LABELS[platform];
          const platformAccounts = getAccountsForPlatform(allAccounts, platform);
          const hasContent = platformsWithContent.has(platform);
          const selectedId = selectedByPlatform[platform];
          const publishState = platformPublishState[platform];
          const publishError = platformPublishErrors[platform];
          const status = statusLabel(publishState);

          const connectAction =
            platform === SocialPlatform.LinkedIn
              ? onConnectLinkedIn
              : platform === SocialPlatform.Facebook
                ? onConnectFacebook
                : platform === SocialPlatform.Threads
                  ? onConnectThreads
                  : onConnectInstagram;

          return (
            <Box
              key={platform}
              sx={{
                p: 2,
                borderRadius: 1,
                border: "1px solid",
                borderColor: hasContent
                  ? alpha(theme.palette.primary.main, 0.25)
                  : "divider",
                bgcolor: hasContent ? alpha(theme.palette.primary.main, 0.03) : "transparent",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {label}
                  {!hasContent ? (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      (add content in step 2)
                    </Typography>
                  ) : null}
                </Typography>
                {status ? (
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color={
                      publishState === "published"
                        ? "success.main"
                        : publishState === "failed"
                          ? "error.main"
                          : "text.secondary"
                    }
                  >
                    {status}
                  </Typography>
                ) : null}
              </Stack>

              {platformAccounts.length === 0 ? (
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    No {label} account connected.
                  </Typography>
                  <Button size="small" variant="outlined" onClick={connectAction} disabled={isSubmitting}>
                    Connect {label}
                  </Button>
                </Stack>
              ) : platformAccounts.length === 1 ? (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {platformAccounts[0].displayName || platformAccounts[0].accountHandle}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant={selectedId === platformAccounts[0].id ? "contained" : "outlined"}
                      disabled={!hasContent || isSubmitting}
                      onClick={() => setPlatformAccount(platform, platformAccounts[0].id)}
                    >
                      {selectedId === platformAccounts[0].id ? "Selected" : "Select"}
                    </Button>
                    {selectedId === platformAccounts[0].id ? (
                      <Button size="small" onClick={() => clearPlatform(platform)} disabled={isSubmitting}>
                        Clear
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              ) : (
                <FormControl component="fieldset" disabled={!hasContent || isSubmitting} sx={{ width: "100%" }}>
                  <RadioGroup
                    value={selectedId != null ? String(selectedId) : ""}
                    onChange={(event) => setPlatformAccount(platform, Number(event.target.value))}
                  >
                    {platformAccounts.map((account) => (
                      <FormControlLabel
                        key={account.id}
                        value={String(account.id)}
                        control={<Radio size="small" />}
                        label={account.displayName || account.accountHandle}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}

              {publishError ? (
                <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                  {publishError}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      {isSubmitting && selectedCount > 0 ? (
        <Box>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            Waiting for platforms to finish publishing…
          </Typography>
        </Box>
      ) : null}

      {selectedCount > 0 ? (
        <Typography variant="caption" color="text.secondary">
          {selectedCount} platform{selectedCount > 1 ? "s" : ""} selected. Only chosen destinations will receive
          this post.
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Select one account per platform you want to publish to.
        </Typography>
      )}

      <TextField
        type="datetime-local"
        label="Schedule time (optional)"
        value={scheduledAt}
        onChange={(event) => onScheduledAtChange(event.target.value)}
        InputLabelProps={{ shrink: true }}
        helperText="Set a future time to schedule all selected destinations, or leave empty to publish now."
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" onClick={onSaveDraft} disabled={isSubmitting}>
          Save draft
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onPublish}
          disabled={isSubmitting || !canPublish}
        >
          {isSubmitting
            ? "Publishing…"
            : `Publish to ${selectedCount} platform${selectedCount !== 1 ? "s" : ""}`}
        </Button>
        <Button
          variant="contained"
          onClick={onSchedule}
          disabled={isSubmitting || !canPublish || !scheduledAt}
        >
          Schedule selected
        </Button>
      </Stack>
    </Stack>
  );
}
