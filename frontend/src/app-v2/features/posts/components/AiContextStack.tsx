import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { LayoutGrid, Megaphone, Sparkles, Store } from "lucide-react";
import type { ReactNode } from "react";

interface ContextLayer {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "muted" | "active";
}

interface AiContextStackProps {
  brandStudioName: string | null;
  channelName: string | null;
  campaignName: string | null;
  campaignObjective?: string | null;
}

export function AiContextStack({
  brandStudioName,
  channelName,
  campaignName,
  campaignObjective,
}: AiContextStackProps) {
  const theme = useTheme();

  const layers: ContextLayer[] = [
    {
      icon: <Store size={14} />,
      label: "Brand Studio",
      value: brandStudioName ?? "Not configured",
      hint: "Team-wide organizational context",
      tone: brandStudioName ? "active" : "muted",
    },
    {
      icon: <LayoutGrid size={14} />,
      label: "Channel",
      value: channelName ?? "—",
      hint: "Publishing identity and tone",
      tone: channelName ? "active" : "muted",
    },
    {
      icon: <Megaphone size={14} />,
      label: "Campaign",
      value: campaignName ?? "—",
      hint: campaignObjective ?? "Editorial initiative",
      tone: campaignName ? "active" : "muted",
    },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <Sparkles size={14} color={theme.palette.primary.main} />
        <Typography variant="subtitle2" fontWeight={600}>
          AI context stack
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Layers of context the AI will use when generating this post (highest priority on top).
      </Typography>

      <Stack spacing={1}>
        {layers.map((layer, index) => {
          const active = layer.tone === "active";
          const accent = active ? theme.palette.primary.main : theme.palette.text.disabled;
          return (
            <Stack
              key={layer.label}
              direction="row"
              spacing={1.25}
              alignItems="flex-start"
              sx={{
                p: 1.25,
                borderRadius: 1,
                bgcolor: alpha(accent, active ? 0.06 : 0.02),
                border: "1px solid",
                borderColor: alpha(accent, active ? 0.3 : 0.15),
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.75,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(accent, 0.18),
                  color: accent,
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {layer.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography
                    variant="caption"
                    sx={{ letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}
                    color={active ? "text.primary" : "text.disabled"}
                  >
                    {index + 1}. {layer.label}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ mt: 0.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  color={active ? "text.primary" : "text.disabled"}
                >
                  {layer.value}
                </Typography>
                {layer.hint ? (
                  <Typography variant="caption" color="text.secondary">
                    {layer.hint}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
