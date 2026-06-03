import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import { SocialPlatform } from "../../content-posts/content-posts.types";
import type { QuickVariantDraft } from "../generate.types";
import { getVariantDefinition } from "../utils/variantHelpers";

const PLATFORM_ORDER: SocialPlatform[] = [
  SocialPlatform.LinkedIn,
  SocialPlatform.Facebook,
  SocialPlatform.Instagram,
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  [SocialPlatform.LinkedIn]: "LinkedIn",
  [SocialPlatform.Facebook]: "Facebook",
  [SocialPlatform.Instagram]: "Instagram",
  [SocialPlatform.X]: "X",
  [SocialPlatform.Threads]: "Threads",
  [SocialPlatform.TikTok]: "TikTok",
};

interface PublishDestinationsPanelProps {
  accounts: SocialAccount[];
  selectedAccountIds: number[];
  onSelectedAccountIdsChange: (ids: number[]) => void;
  enabledVariants: QuickVariantDraft[];
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  onConnectLinkedIn: () => void;
  onConnectMeta: () => void;
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

export function PublishDestinationsPanel({
  accounts,
  selectedAccountIds,
  onSelectedAccountIdsChange,
  enabledVariants,
  scheduledAt,
  onScheduledAtChange,
  onConnectLinkedIn,
  onConnectMeta,
  isSubmitting,
  onSaveDraft,
  onPublish,
  onSchedule,
}: PublishDestinationsPanelProps) {
  const theme = useTheme();
  const selectedSet = new Set(selectedAccountIds);

  const platformsWithContent = new Set(
    enabledVariants.filter(variantReady).map((v) => getVariantDefinition(v.key).platform)
  );

  const accountsByPlatform = PLATFORM_ORDER.map((platform) => ({
    platform,
    accounts: accounts.filter((account) => account.platform === platform),
  })).filter((group) => group.accounts.length > 0 || platformsWithContent.has(group.platform));

  const toggleAccount = (accountId: number) => {
    if (selectedSet.has(accountId)) {
      onSelectedAccountIdsChange(selectedAccountIds.filter((id) => id !== accountId));
    } else {
      onSelectedAccountIdsChange([...selectedAccountIds, accountId]);
    }
  };

  const selectAllReady = () => {
    const readyIds = accounts
      .filter((account) => platformsWithContent.has(account.platform))
      .map((account) => account.id);
    onSelectedAccountIdsChange(readyIds);
  };

  return (
    <Stack spacing={2}>
      {accounts.length === 0 ? (
        <Alert severity="warning">
          No connected accounts yet. Link at least one platform to publish.
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button size="small" variant="outlined" onClick={onConnectLinkedIn}>
          Connect LinkedIn
        </Button>
        <Button size="small" variant="outlined" onClick={onConnectMeta}>
          Connect Meta / Instagram
        </Button>
        {accounts.length > 0 ? (
          <Button size="small" onClick={selectAllReady}>
            Select all with content
          </Button>
        ) : null}
      </Stack>

      <Stack spacing={1.5}>
        {accountsByPlatform.map(({ platform, accounts: platformAccounts }) => {
          const hasContent = platformsWithContent.has(platform);
          const label = PLATFORM_LABELS[platform];

          if (platformAccounts.length === 0) {
            return (
              <Box
                key={platform}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px dashed",
                  borderColor: "divider",
                  opacity: 0.85,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hasContent
                    ? "Content ready — connect an account to publish."
                    : "Enable and fill this platform variant to publish here."}
                </Typography>
              </Box>
            );
          }

          return (
            <Box
              key={platform}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: hasContent ? alpha(theme.palette.primary.main, 0.25) : "divider",
                bgcolor: hasContent ? alpha(theme.palette.primary.main, 0.03) : "transparent",
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                {label}
                {!hasContent ? (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (no content yet)
                  </Typography>
                ) : null}
              </Typography>
              <FormGroup>
                {platformAccounts.map((account) => {
                  const disabled = !hasContent;
                  return (
                    <FormControlLabel
                      key={account.id}
                      disabled={disabled}
                      control={
                        <Checkbox
                          checked={selectedSet.has(account.id)}
                          onChange={() => toggleAccount(account.id)}
                          disabled={disabled}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {account.displayName || account.accountHandle}
                        </Typography>
                      }
                    />
                  );
                })}
              </FormGroup>
            </Box>
          );
        })}
      </Stack>

      {selectedAccountIds.length > 0 ? (
        <Typography variant="caption" color="text.secondary">
          {selectedAccountIds.length} destination{selectedAccountIds.length > 1 ? "s" : ""} selected — each
          receives the variant for its platform.
        </Typography>
      ) : null}

      <TextField
        type="datetime-local"
        label="Schedule time (optional)"
        value={scheduledAt}
        onChange={(event) => onScheduledAtChange(event.target.value)}
        InputLabelProps={{ shrink: true }}
        helperText="Leave empty to publish immediately, or set a future time to schedule all selected destinations."
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" onClick={onSaveDraft} disabled={isSubmitting}>
          Save draft
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onPublish}
          disabled={isSubmitting || selectedAccountIds.length === 0}
        >
          {isSubmitting
            ? "Processing..."
            : `Publish now${selectedAccountIds.length > 0 ? ` (${selectedAccountIds.length})` : ""}`}
        </Button>
        <Button
          variant="contained"
          onClick={onSchedule}
          disabled={isSubmitting || selectedAccountIds.length === 0 || !scheduledAt}
        >
          Schedule selected
        </Button>
      </Stack>
    </Stack>
  );
}
