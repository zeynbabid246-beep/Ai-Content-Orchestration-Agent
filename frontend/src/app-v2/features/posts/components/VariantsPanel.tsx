import { Box, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Plus, Trash2 } from "lucide-react";
import { SocialPlatform, type ContentPostVariant } from "../../content-posts/content-posts.types";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  [SocialPlatform.Facebook]: "Facebook",
  [SocialPlatform.LinkedIn]: "LinkedIn",
  [SocialPlatform.Instagram]: "Instagram",
  [SocialPlatform.X]: "X / Twitter",
  [SocialPlatform.Threads]: "Threads",
  [SocialPlatform.TikTok]: "TikTok",
};

const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  [SocialPlatform.Facebook]: "#1877F2",
  [SocialPlatform.LinkedIn]: "#0A66C2",
  [SocialPlatform.Instagram]: "#E1306C",
  [SocialPlatform.X]: "#0EA5E9",
  [SocialPlatform.Threads]: "#94A3B8",
  [SocialPlatform.TikTok]: "#000000",
};

interface VariantsPanelProps {
  variants: ContentPostVariant[];
  onAddVariant: (platform: SocialPlatform) => void;
  onRemoveVariant: (index: number) => void;
}

export function VariantsPanel({ variants, onAddVariant, onRemoveVariant }: VariantsPanelProps) {
  const theme = useTheme();

  const usedPlatforms = new Set(variants.map((variant) => variant.platform));
  const availablePlatforms = (Object.values(SocialPlatform) as SocialPlatform[]).filter(
    (platform) => !usedPlatforms.has(platform)
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          Platform variants
        </Typography>
        <Chip size="small" label={`${variants.length}`} variant="outlined" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Content-only adaptations. Publishing and retries live in PostPublications.
      </Typography>

      <Stack spacing={1}>
        {variants.length === 0 ? (
          <Box
            sx={{
              py: 2.5,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No variants yet
            </Typography>
          </Box>
        ) : (
          variants.map((variant, index) => {
            const color = PLATFORM_COLOR[variant.platform] ?? theme.palette.primary.main;
            return (
              <Stack
                key={`${variant.platform}-${index}`}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: alpha(color, 0.3),
                  bgcolor: alpha(color, 0.06),
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: color,
                  }}
                />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                  {PLATFORM_LABELS[variant.platform]}
                </Typography>
                <IconButton
                  size="small"
                  aria-label={`Remove ${PLATFORM_LABELS[variant.platform]} variant`}
                  onClick={() => onRemoveVariant(index)}
                >
                  <Trash2 size={12} />
                </IconButton>
              </Stack>
            );
          })
        )}
      </Stack>

      {availablePlatforms.length > 0 ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ letterSpacing: 1, textTransform: "uppercase", display: "block", mb: 0.75 }}
          >
            Add variant
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {availablePlatforms.map((platform) => (
              <Chip
                key={platform}
                size="small"
                icon={<Plus size={11} />}
                label={PLATFORM_LABELS[platform]}
                onClick={() => onAddVariant(platform)}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}
