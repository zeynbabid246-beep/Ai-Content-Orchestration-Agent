import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChannelContext } from "../hooks/useChannelContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { useCampaigns } from "../../campaigns/campaigns.queries";
import {
  CONTENT_DISPLAY_FILTERS,
  matchesPostDisplayFilter,
  type ContentDisplayStatus,
} from "../../content-posts/content-posts.display";
import {
  ContentPostRow,
  ContentPostRowSkeleton,
} from "../../content-posts/components/ContentPostRow";
import { WorkspaceEmptyState } from "../../../shared/ui/WorkspaceEmptyState";
import { channelPaths } from "../../../shared/lib/routes";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { usePostOutboundNotice } from "../../posts/hooks/usePostOutboundNotice";

type StatusFilter = "all" | ContentDisplayStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CONTENT_DISPLAY_FILTERS,
];

export function ChannelContentPage() {
  const navigate = useNavigate();
  const { canMutateContent } = useTeamPermissions();
  const { channelId } = useChannelContext();
  const { data: allPosts = [], isLoading } = useContentPosts();
  const { data: campaigns = [] } = useCampaigns();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { notice: outboundNotice, dismissNotice, outcome } = usePostOutboundNotice();

  useEffect(() => {
    if (outcome === "scheduled") {
      setStatusFilter("Scheduled");
    } else if (outcome === "published") {
      setStatusFilter("Published");
    }
  }, [outcome]);

  const campaignNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of campaigns.filter((x) => x.channelId === channelId)) {
      map.set(c.id, c.name);
    }
    return map;
  }, [campaigns, channelId]);

  const posts = useMemo(
    () =>
      allPosts
        .filter((post) => post.channelId === channelId)
        .filter((post) => statusFilter === "all" || matchesPostDisplayFilter(post, statusFilter))
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [allPosts, channelId, statusFilter]
  );

  if (!channelId) return null;

  return (
    <Stack spacing={2.5}>
      {outboundNotice ? (
        <Alert severity={outboundNotice.severity} onClose={dismissNotice}>
          {outboundNotice.text}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Channel content
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All posts in this channel
          </Typography>
        </Box>
        {canMutateContent ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={16} />}
            onClick={() => navigate(channelPaths.newPost(channelId))}
          >
            New post
          </Button>
        ) : null}
      </Stack>

      <ToggleButtonGroup
        size="small"
        value={statusFilter}
        exclusive
        onChange={(_, value: StatusFilter | null) => {
          if (value) setStatusFilter(value);
        }}
        sx={{ flexWrap: "wrap" }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((i) => (
            <ContentPostRowSkeleton key={i} />
          ))}
        </Stack>
      ) : posts.length === 0 ? (
        <WorkspaceEmptyState
          icon={<FileText size={22} />}
          title="No content yet"
          description={
            statusFilter === "all"
              ? "Posts you create in this channel will appear here."
              : "No posts match this status filter."
          }
          action={
            canMutateContent && statusFilter === "all" ? (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => navigate(channelPaths.newPost(channelId))}
              >
                New post
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack spacing={1}>
          {posts.map((post) => (
            <ContentPostRow
              key={post.id}
              post={post}
              campaignName={
                post.campaignId != null
                  ? campaignNameById.get(post.campaignId)
                  : undefined
              }
              showCampaign
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
