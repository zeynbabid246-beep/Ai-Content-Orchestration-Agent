import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Cloud, CloudOff, FileEdit, Loader2 } from "lucide-react";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

interface SaveStatusPanelProps {
  saveState: SaveState;
  errorMessage?: string | null;
}

export function SaveStatusPanel({ saveState, errorMessage }: SaveStatusPanelProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  const label =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "All changes saved"
        : saveState === "dirty"
          ? "Unsaved changes"
          : saveState === "error"
            ? "Save failed"
            : "Draft";

  const Icon =
    saveState === "saving"
      ? Loader2
      : saveState === "error" || saveState === "dirty"
        ? CloudOff
        : Cloud;

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
          <FileEdit size={12} />
        </Box>
        <Typography variant="subtitle2" fontWeight={600}>
          Draft
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Icon size={14} style={{ opacity: 0.7 }} />
        <Typography variant="caption" color={saveState === "error" ? "error" : "text.secondary"}>
          {errorMessage ?? label}
        </Typography>
      </Stack>
    </Paper>
  );
}
