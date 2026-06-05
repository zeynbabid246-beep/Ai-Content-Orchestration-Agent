import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { ContentStatus } from "../../content-posts/content-posts.types";
import { campaignPaths } from "../../../shared/lib/routes";
import {
  ContentPostRow,
  ContentPostRowSkeleton,
} from "../../content-posts/components/ContentPostRow";
import { WorkspaceEmptyState } from "../../../shared/ui/WorkspaceEmptyState";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { usePostOutboundNotice } from "../../posts/hooks/usePostOutboundNotice";

type StatusFilter = "all" | ContentStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: ContentStatus.Draft, label: "Drafts" },
  { value: ContentStatus.Review, label: "In review" },
  { value: ContentStatus.Scheduled, label: "Scheduled" },
  { value: ContentStatus.Published, label: "Published" },
];

export function CampaignPostsPage() {
  const navigate = useNavigate();
  const { canMutateContent } = useTeamPermissions();
  const { channelId } = useChannelContext();
  const { campaignId } = useCampaignContext();
  const { data: allPosts = [], isLoading } = useContentPosts();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { notice: outboundNotice, dismissNotice, outcome } = usePostOutboundNotice();

  useEffect(() => {
    if (outcome === "scheduled") {
      setStatusFilter(ContentStatus.Scheduled);
    } else if (outcome === "published") {
      setStatusFilter(ContentStatus.Published);
    }
  }, [outcome]);

  const posts = useMemo(
    () =>
      allPosts
        .filter((post) => post.campaignId === campaignId)
        .filter((post) => statusFilter === "all" || post.status === statusFilter)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [allPosts, campaignId, statusFilter]
  );

  if (!channelId || !campaignId) return null;

  return (
    <Stack spacing={2.5}>
      {outboundNotice ? (
        <Alert severity={outboundNotice.severity} onClose={dismissNotice}>
          {outboundNotice.text}
        </Alert>
      ) : null}

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Posts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Editorial content in this campaign
          </Typography>
        </Box>
        {canMutateContent ? (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
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
          title="No posts yet"
          description={
            statusFilter === "all"
              ? "Draft editorial pieces for this campaign."
              : "No posts match this status."
          }
          action={
            canMutateContent && statusFilter === "all" ? (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
              >
                Create post
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack spacing={1}>
          {posts.map((post) => (
            <ContentPostRow key={post.id} post={post} showCampaign={false} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
