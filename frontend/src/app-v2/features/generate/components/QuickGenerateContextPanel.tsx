import { Box, Paper, Stack, Switch, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Sparkles, Store } from "lucide-react";
import type { TeamBrandStudio } from "../../brand-studio/types/brandStudio.types";

interface QuickGenerateContextPanelProps {
  brandStudio: TeamBrandStudio | null;
  useBrandContext: boolean;
  onUseBrandContextChange: (value: boolean) => void;
  disabled?: boolean;
}

export function QuickGenerateContextPanel({
  brandStudio,
  useBrandContext,
  onUseBrandContextChange,
  disabled,
}: QuickGenerateContextPanelProps) {
  const theme = useTheme();
  const hasBrand = Boolean(brandStudio?.parsedProfile.brandName || brandStudio?.parsedProfile.brandSummary);
  const brandName = brandStudio?.parsedProfile.brandName ?? "Not configured";
  const tone = brandStudio?.defaultConfig.toneOfVoice;
  const audience = brandStudio?.defaultConfig.targetAudience;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Sparkles size={14} color={theme.palette.primary.main} />
        <Typography variant="subtitle2" fontWeight={600}>
          Brand context
        </Typography>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          p: 1.25,
          mb: 1.5,
          borderRadius: 1,
          border: "1px solid",
          borderColor: useBrandContext && hasBrand ? alpha(theme.palette.primary.main, 0.35) : "divider",
          bgcolor: useBrandContext && hasBrand ? alpha(theme.palette.primary.main, 0.05) : "transparent",
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Use Brand Studio
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hasBrand
              ? "Tone, audience, and pillars feed into AI generation."
              : "Import a brand in Brand Studio to enable contextual generation."}
          </Typography>
        </Box>
        <Switch
          checked={useBrandContext && hasBrand}
          onChange={(event) => onUseBrandContextChange(event.target.checked)}
          disabled={disabled || !hasBrand}
        />
      </Stack>

      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            p: 1.25,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.text.primary, 0.03),
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.75,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <Store size={14} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
              Active context
            </Typography>
            <Typography variant="body2" fontWeight={600} noWrap>
              {useBrandContext && hasBrand ? brandName : "No brand context"}
            </Typography>
            {useBrandContext && hasBrand ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {tone ? `Tone: ${tone}` : "Tone not set"}
                {audience ? ` · Audience: ${audience}` : ""}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                AI will generate from your brief only.
              </Typography>
            )}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
