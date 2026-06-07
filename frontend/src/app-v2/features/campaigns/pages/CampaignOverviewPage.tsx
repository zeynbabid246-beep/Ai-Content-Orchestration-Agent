import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileEdit, Plus, Sparkles } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { campaignPaths } from "../../../shared/lib/routes";
import { ContentPostRow } from "../../content-posts/components/ContentPostRow";
import { CampaignWelcomeDialog } from "../components/CampaignWelcomeDialog";
import { CampaignProgressChips } from "../components/CampaignProgressChips";
import { resolveCampaignPostSummary } from "../campaigns.display";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

const WORKFLOW_STEPS = ["Create", "Edit", "Schedule or publish"] as const;

export function CampaignOverviewPage() {
  const { canMutateContent } = useTeamPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const navigate = useNavigate();
  const { channelId } = useChannelContext();
  const { campaignId, campaign } = useCampaignContext();
  const { data: allPosts = [] } = useContentPosts();

  const posts = useMemo(
    () =>
      allPosts
        .filter((post) => post.campaignId === campaignId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [allPosts, campaignId]
  );

  const recentPosts = useMemo(() => posts.slice(0, 6), [posts]);

  const postSummary = useMemo(
    () => resolveCampaignPostSummary(campaign?.postSummary, posts),
    [campaign?.postSummary, posts]
  );

  const campaignWithSummary = useMemo(
    () => (campaign ? { ...campaign, postSummary } : null),
    [campaign, postSummary]
  );

  useEffect(() => {
    if (searchParams.get("welcome") === "1" && campaign) {
      setWelcomeOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("welcome");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, campaign]);

  const dismissWelcome = () => {
    setWelcomeOpen(false);
  };

  const goManual = () => {
    dismissWelcome();
    if (channelId && campaignId) {
      if (posts.length === 0) {
        navigate(campaignPaths.newPost(channelId, campaignId));
      }
    }
  };

  const goAiPlan = () => {
    dismissWelcome();
    if (channelId && campaignId) {
      navigate(campaignPaths.aiPlan(channelId, campaignId));
    }
  };

  if (!channelId || !campaignId || !campaign) return null;

  const dateRange =
    campaign.createdAt && campaign.updatedAt
      ? `Updated ${new Date(campaign.updatedAt).toLocaleDateString()}`
      : null;

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1} flexWrap="wrap" useFlexGap>
          {dateRange ? (
            <Typography variant="caption" color="text.secondary">
              {dateRange}
            </Typography>
          ) : null}
          {campaignWithSummary ? (
            <CampaignProgressChips campaign={campaignWithSummary} />
          ) : null}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
          {campaign.objective?.trim() ||
            campaign.description?.trim() ||
            "No objective or brief yet. Add details in Settings."}
        </Typography>

        {canMutateContent ? (
          <Stack direction="row" spacing={1.5} mt={2.5} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Plus size={14} />}
              onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
            >
              {posts.length === 0 ? "Create first post" : "New post"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Sparkles size={14} />}
              onClick={goAiPlan}
            >
              Plan with AI
            </Button>
            <Button
              variant="text"
              startIcon={<FileEdit size={14} />}
              onClick={() => navigate(campaignPaths.posts(channelId, campaignId))}
            >
              All posts ({posts.length})
            </Button>
          </Stack>
        ) : (
          <Button
            sx={{ mt: 2 }}
            variant="text"
            startIcon={<FileEdit size={14} />}
            onClick={() => navigate(campaignPaths.posts(channelId, campaignId))}
          >
            View posts
          </Button>
        )}
      </Paper>

      {posts.length === 0 ? (
        <Paper sx={{ p: 3, borderStyle: "dashed" }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Get started with your first post
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pick target platforms, write copy, preview each network, then publish to all linked accounts at once.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {WORKFLOW_STEPS.map((step, index) => (
              <Chip
                key={step}
                size="small"
                label={`${index + 1}. ${step}`}
                variant="outlined"
              />
            ))}
          </Stack>
          {canMutateContent ? (
            <Button
              variant="contained"
              startIcon={<Plus size={14} />}
              onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
            >
              Create first post
            </Button>
          ) : null}
        </Paper>
      ) : (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Recent posts
          </Typography>
          <Stack spacing={1}>
            {recentPosts.map((post) => (
              <ContentPostRow key={post.id} post={post} showCampaign={false} />
            ))}
          </Stack>
        </Box>
      )}

      <CampaignWelcomeDialog
        open={welcomeOpen}
        campaignName={campaign.name}
        onManual={goManual}
        onAiPlan={goAiPlan}
        onClose={dismissWelcome}
      />
    </Stack>
  );
}
