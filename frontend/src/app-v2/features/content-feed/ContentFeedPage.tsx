import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContentPosts } from "../content-posts/content-posts.queries";
import { deleteContentPost } from "../content-posts/content-posts.api";
import { useChannels } from "../channels/channels.queries";
import { useCampaigns } from "../campaigns/campaigns.queries";
import { useSocialAccounts } from "../social-media/social-accounts.queries";
import { SocialAccountStatus } from "../social-media/social-accounts.types";
import { publishPublication } from "../content-posts/publications.api";
import {
  CONTENT_DISPLAY_FILTERS,
  matchesPostDisplayFilter,
  type ContentDisplayStatus,
} from "../content-posts/content-posts.display";
import {
  ContentPostRow,
  ContentPostRowSkeleton,
} from "../content-posts/components/ContentPostRow";
import type { ContentPost } from "../content-posts/content-posts.types";
import { PageHeader } from "../../shared/ui/PageHeader";
import { WorkspaceEmptyState } from "../../shared/ui/WorkspaceEmptyState";
import { useTeamPermissions } from "../../shared/hooks/useTeamPermissions";
import { ROUTES } from "../../shared/lib/routes";

type StatusFilter = "all" | ContentDisplayStatus;

const STATUS_SEGMENTS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CONTENT_DISPLAY_FILTERS,
];

export function ContentFeedPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canMutateContent } = useTeamPermissions();
  const { data: posts = [], isLoading, error } = useContentPosts();
  const { data: channels = [] } = useChannels();
  const { data: campaigns = [] } = useCampaigns();
  const { data: socialAccounts = [] } = useSocialAccounts();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<number | "all">("all");

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<ContentPost | null>(null);

  // Feedback snackbar
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  const channelNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const ch of channels) map.set(ch.id, ch.name);
    return map;
  }, [channels]);

  const campaignNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of campaigns) map.set(c.id, c.name);
    return map;
  }, [campaigns]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...posts]
      .filter((post) => {
        if (channelFilter !== "all" && post.channelId !== channelFilter) return false;
        if (statusFilter !== "all" && !matchesPostDisplayFilter(post, statusFilter)) return false;
        if (term) {
          const haystack = (post.title ?? "").toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [posts, search, statusFilter, channelFilter]);

  const hasFilters =
    search.trim().length > 0 || statusFilter !== "all" || channelFilter !== "all";

  // ── Delete mutation ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContentPost(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contentPosts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSnack({ msg: "Post deleted.", severity: "success" });
    },
    onError: () => setSnack({ msg: "Failed to delete post.", severity: "error" }),
  });

  // ── Publish mutation ─────────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: ({ postId, socialAccountId }: { postId: number; socialAccountId: number }) =>
      publishPublication(postId, {
        socialAccountId,
        postVariantId: null,
        idempotencyKey: `feed-${postId}-${Date.now()}`,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contentPosts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSnack({ msg: "Post queued for publishing!", severity: "success" });
    },
    onError: (err) =>
      setSnack({
        msg: err instanceof Error ? err.message : "Failed to publish post.",
        severity: "error",
      }),
  });

  const findActiveAccount = (post: ContentPost) => {
    // Prefer account linked to the post's channel
    if (post.channelId != null) {
      const linked = socialAccounts.find(
        (a) => a.status === SocialAccountStatus.Active && a.linkedChannelIds.includes(post.channelId!)
      );
      if (linked) return linked;
    }
    return socialAccounts.find((a) => a.status === SocialAccountStatus.Active) ?? null;
  };

  const handlePublish = (post: ContentPost) => {
    const account = findActiveAccount(post);
    if (!account) {
      setSnack({ msg: "No active social account linked. Connect one in Integrations.", severity: "error" });
      return;
    }
    publishMutation.mutate({ postId: post.id, socialAccountId: account.id });
  };

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  };

  const subtitle =
    statusFilter === "all" && channelFilter === "all"
      ? "All content across your workspace"
      : "Filtered view of workspace content";

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Content Feed"
        subtitle={subtitle}
        actions={
          canMutateContent ? (
            <Button variant="contained" onClick={() => navigate(ROUTES.generate)}>
              Quick generate
            </Button>
          ) : undefined
        }
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: "flex", color: "text.secondary", mr: 1 }}>
                <Search size={16} />
              </Box>
            ),
          }}
        />
        <TextField
          size="small"
          select
          label="Channel"
          value={channelFilter}
          onChange={(e) =>
            setChannelFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All channels</MenuItem>
          {channels.map((ch) => (
            <MenuItem key={ch.id} value={ch.id}>
              {ch.name}
            </MenuItem>
          ))}
        </TextField>
        <ToggleButtonGroup
          size="small"
          value={statusFilter}
          exclusive
          onChange={(_, value: StatusFilter | null) => {
            if (value) setStatusFilter(value);
          }}
          sx={{ flexWrap: "wrap" }}
        >
          {STATUS_SEGMENTS.map((seg) => (
            <ToggleButton key={seg.value} value={seg.value}>
              {seg.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => (
            <ContentPostRowSkeleton key={i} />
          ))}
        </Stack>
      ) : error ? (
        <Alert severity="error">Failed to load content feed. Please try again later.</Alert>
      ) : filtered.length > 0 ? (
        <Stack spacing={1}>
          {filtered.map((post) => (
            <ContentPostRow
              key={post.id}
              post={post}
              channelName={
                post.channelId != null
                  ? channelNameById.get(post.channelId)
                  : undefined
              }
              campaignName={
                post.campaignId != null
                  ? campaignNameById.get(post.campaignId)
                  : undefined
              }
              showChannel
              showCampaign
              onDelete={canMutateContent ? (p) => setPendingDelete(p) : undefined}
              onPublish={canMutateContent ? handlePublish : undefined}
            />
          ))}
        </Stack>
      ) : posts.length === 0 ? (
        <WorkspaceEmptyState
          icon={<FileText size={22} />}
          title="Your feed is empty"
          description="No posts yet. Editors can create content from a channel or via Quick Generate."
          action={
            canMutateContent ? (
              <Button variant="contained" onClick={() => navigate(ROUTES.generate)}>
                Quick generate
              </Button>
            ) : undefined
          }
        />
      ) : (
        <WorkspaceEmptyState
          icon={<FileText size={22} />}
          title="No posts match"
          description={
            hasFilters
              ? "Try adjusting search or filters."
              : "Nothing to show right now."
          }
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={pendingDelete != null} onClose={() => setPendingDelete(null)} maxWidth="xs">
        <DialogTitle>Delete post?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{pendingDelete?.title?.trim() || "This post"}</strong> will be permanently deleted.
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback snackbar */}
      <Snackbar
        open={snack != null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
}
