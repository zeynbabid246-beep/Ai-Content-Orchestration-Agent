import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import { ContentStatus } from "../../features/content-posts/content-posts.types";
import { toDisplayStatus } from "../../features/content-posts/content-posts.display";

type ChipColor = ChipProps["color"];

const CONTENT_DISPLAY_COLORS: Record<string, ChipColor> = {
  Draft: "default",
  Scheduled: "warning",
  Published: "success",
  Deleted: "default",
};

const CAMPAIGN_STATUS_COLORS: Record<string, ChipColor> = {
  Active: "success",
  Archived: "default",
};

interface StatusChipProps {
  status: string;
  kind?: "content" | "campaign";
  size?: ChipProps["size"];
}

export function StatusChip({ status, kind = "content", size = "small" }: StatusChipProps) {
  const label =
    kind === "content"
      ? toDisplayStatus(status as ContentStatus)
      : status;
  const map = kind === "campaign" ? CAMPAIGN_STATUS_COLORS : CONTENT_DISPLAY_COLORS;
  const color = map[label] ?? "default";

  return (
    <Chip
      size={size}
      label={label}
      color={color}
      variant={color === "default" ? "outlined" : "filled"}
      sx={{ borderRadius: 1, fontWeight: 500 }}
    />
  );
}
