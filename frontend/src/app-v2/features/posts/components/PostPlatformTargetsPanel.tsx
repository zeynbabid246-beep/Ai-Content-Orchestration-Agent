import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SocialPlatform } from "../../content-posts/content-posts.types";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  PUBLISHABLE_PLATFORMS,
} from "../utils/variantPreview";

interface PostPlatformTargetsPanelProps {
  channelAccounts: SocialAccount[];
  selectedPlatforms: SocialPlatform[];
  onSelectedPlatformsChange: (platforms: SocialPlatform[]) => void;
  disabled?: boolean;
}

export function PostPlatformTargetsPanel({
  channelAccounts,
  selectedPlatforms,
  onSelectedPlatformsChange,
  disabled = false,
}: PostPlatformTargetsPanelProps) {
  const linkedPlatforms = PUBLISHABLE_PLATFORMS.filter((platform) =>
    channelAccounts.some((account) => account.platform === platform)
  );

  const toggle = (platform: SocialPlatform) => {
    if (disabled) return;
    if (selectedPlatforms.includes(platform)) {
      onSelectedPlatformsChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onSelectedPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
        Target platforms
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Choose where this post will publish. Only accounts linked to this channel are available.
      </Typography>

      {linkedPlatforms.length === 0 ? (
        <Alert severity="warning" sx={{ fontSize: 13 }}>
          No publishing accounts linked to this channel. Connect platforms under Channel → Publishing.
        </Alert>
      ) : (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {linkedPlatforms.map((platform) => {
            const selected = selectedPlatforms.includes(platform);
            const color = PLATFORM_COLORS[platform];
            const account = channelAccounts.find((a) => a.platform === platform);
            return (
              <Chip
                key={platform}
                label={`${PLATFORM_LABELS[platform]}${account ? "" : ""}`}
                onClick={() => toggle(platform)}
                disabled={disabled}
                variant={selected ? "filled" : "outlined"}
                sx={
                  selected
                    ? {
                        bgcolor: alpha(color, 0.2),
                        color,
                        borderColor: alpha(color, 0.5),
                      }
                    : undefined
                }
              />
            );
          })}
        </Stack>
      )}

      {selectedPlatforms.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            {selectedPlatforms.length} platform{selectedPlatforms.length === 1 ? "" : "s"} selected
          </Typography>
        </Box>
      ) : null}
    </Paper>
  );
}
