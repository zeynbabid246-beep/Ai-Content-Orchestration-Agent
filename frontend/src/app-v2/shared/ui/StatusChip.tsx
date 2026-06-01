import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

type ChipColor = ChipProps["color"];

const CONTENT_STATUS_COLORS: Record<string, ChipColor> = {
  Draft: "default",
  Review: "info",
  Approved: "success",
  Scheduled: "warning",
  Published: "success",
  Archived: "default",
};

const CAMPAIGN_STATUS_COLORS: Record<string, ChipColor> = {
  Draft: "default",
  Active: "success",
  Paused: "warning",
  Completed: "secondary",
  Archived: "default",
};

interface StatusChipProps {
  status: string;
  kind?: "content" | "campaign";
  size?: ChipProps["size"];
}

export function StatusChip({ status, kind = "content", size = "small" }: StatusChipProps) {
  const map = kind === "campaign" ? CAMPAIGN_STATUS_COLORS : CONTENT_STATUS_COLORS;
  const color = map[status] ?? "default";

  return (
    <Chip
      size={size}
      label={status}
      color={color}
      variant={color === "default" ? "outlined" : "filled"}
      sx={{ borderRadius: 1, fontWeight: 500 }}
    />
  );
}
