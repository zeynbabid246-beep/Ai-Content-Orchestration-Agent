import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusChip } from "../../../shared/ui/StatusChip";
import { postEditorPath } from "../../../shared/lib/routes";
import type { ContentPost } from "../content-posts.types";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "../../posts/utils/variantPreview";

export interface ContentPostRowProps {
  post: ContentPost;
  channelName?: string;
  campaignName?: string;
  showChannel?: boolean;
  showCampaign?: boolean;
}

function formatWhen(date: string | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContentPostRow({
  post,
  channelName,
  campaignName,
  showChannel = false,
  showCampaign = true,
}: ContentPostRowProps) {
  const navigate = useNavigate();
  const channelId = post.channelId;
  const canOpen = channelId != null;

  const meta: string[] = [];
  if (showChannel && channelName) meta.push(channelName);
  if (showCampaign && campaignName) meta.push(campaignName);
  const updated = formatWhen(post.updatedAt);
  if (updated) meta.push(`Updated ${updated}`);
  const scheduled = formatWhen(post.scheduledAt);
  if (scheduled && post.status === "Scheduled") meta.push(`Scheduled ${scheduled}`);

  const platformVariants = (post.postVariants ?? []).filter(
    (variant) => PLATFORM_LABELS[variant.platform] != null
  );

  const handleClick = () => {
    if (!canOpen || channelId == null) return;
    navigate(postEditorPath(channelId, post.id, post.campaignId ?? null));
  };

  return (
    <Stack
      component={Paper}
      variant="outlined"
      direction="row"
      alignItems="center"
      spacing={2}
      onClick={canOpen ? handleClick : undefined}
      sx={{
        p: 1.75,
        cursor: canOpen ? "pointer" : "default",
        transition: "border-color 0.18s, background 0.18s",
        "&:hover": canOpen
          ? { borderColor: "primary.main", bgcolor: "action.hover" }
          : undefined,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {post.title?.trim() || "Untitled post"}
        </Typography>
        {meta.length > 0 ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta.join(" · ")}
          </Typography>
        ) : null}
        {platformVariants.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
            {platformVariants.map((variant) => {
              const color = PLATFORM_COLORS[variant.platform];
              return (
                <Chip
                  key={variant.platform}
                  size="small"
                  label={PLATFORM_LABELS[variant.platform]}
                  sx={{
                    height: 20,
                    fontSize: 11,
                    bgcolor: alpha(color, 0.12),
                    color,
                    borderColor: alpha(color, 0.35),
                  }}
                  variant="outlined"
                />
              );
            })}
          </Stack>
        ) : null}
      </Box>
      <StatusChip status={post.status} />
      {canOpen ? <ChevronRight size={16} style={{ opacity: 0.45, flexShrink: 0 }} /> : null}
    </Stack>
  );
}

export function ContentPostRowSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 1.75 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Box sx={{ height: 14, width: "55%", bgcolor: "action.hover", borderRadius: 0.5, mb: 0.75 }} />
          <Box sx={{ height: 10, width: "35%", bgcolor: "action.hover", borderRadius: 0.5 }} />
        </Box>
        <Box sx={{ width: 64, height: 22, bgcolor: "action.hover", borderRadius: 1 }} />
      </Stack>
    </Paper>
  );
}
