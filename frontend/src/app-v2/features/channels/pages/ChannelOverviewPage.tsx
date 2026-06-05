import { useMemo } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { ArrowUpRight, Plus, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChannelContext } from "../hooks/useChannelContext";
import { useCampaigns } from "../../campaigns/campaigns.queries";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { campaignPaths, channelPaths } from "../../../shared/lib/routes";
import { EntityAvatar } from "../../../shared/ui/EntityAvatar";
import { getEntityColor } from "../../../shared/lib/entityVisual";
import { CampaignStatusChip } from "../../campaigns/components/CampaignStatusChip";
import { ContentPostRow } from "../../content-posts/components/ContentPostRow";
import { ContentStatus } from "../../content-posts/content-posts.types";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

export function ChannelOverviewPage() {
  const navigate = useNavigate();
  const { canManageChannels, canMutateContent } = useTeamPermissions();
  const { channelId, channel } = useChannelContext();
  const { data: allCampaigns = [] } = useCampaigns();
  const { data: allAccounts = [] } = useSocialAccounts();
  const { data: allPosts = [] } = useContentPosts();

  const campaigns = useMemo(
    () => allCampaigns.filter((c) => c.channelId === channelId),
    [allCampaigns, channelId]
  );
  const accounts = useMemo(
    () => allAccounts.filter((a) => channelId != null && a.linkedChannelIds.includes(channelId)),
    [allAccounts, channelId]
  );
  const channelPosts = useMemo(
    () => allPosts.filter((p) => p.channelId === channelId),
    [allPosts, channelId]
  );

  const recentCampaigns = useMemo(
    () =>
      [...campaigns]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [campaigns]
  );

  const attentionPosts = useMemo(
    () =>
      channelPosts
        .filter(
          (p) =>
            p.status === ContentStatus.Draft || p.status === ContentStatus.Review
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [channelPosts]
  );

  const campaignNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of campaigns) map.set(c.id, c.name);
    return map;
  }, [campaigns]);

  if (!channelId || !channel) return null;

  const publishingHint =
    accounts.length > 0
      ? `${accounts.length} ${accounts.length === 1 ? "account" : "accounts"} connected`
      : "No accounts — connect in Publishing";

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2, bgcolor: "background.default" }}>
        <Typography variant="body2" color="text.secondary">
          Publishing: <strong>{publishingHint}</strong>
        </Typography>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Campaigns
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recent initiatives in this channel
            </Typography>
          </Box>
          {canManageChannels ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Plus size={14} />}
              onClick={() => navigate(channelPaths.campaigns(channelId))}
            >
              New campaign
            </Button>
          ) : null}
        </Stack>

        {recentCampaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No campaigns yet.
            {canManageChannels ? " Create one from the Campaigns tab." : ""}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {recentCampaigns.map((campaign) => (
              <Paper
                key={campaign.id}
                variant="outlined"
                onClick={() => navigate(campaignPaths.overview(channelId, campaign.id))}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EntityAvatar
                    name={campaign.name}
                    seed={`c-${campaign.id}`}
                    size={32}
                    color={getEntityColor(`c-${campaign.id}`)}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {campaign.name}
                    </Typography>
                  </Box>
                  <CampaignStatusChip status={campaign.status} />
                  <ArrowUpRight size={14} style={{ opacity: 0.5 }} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Content needing attention
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drafts and posts in review
            </Typography>
          </Box>
          <Button
            size="small"
            variant="text"
            endIcon={<ArrowUpRight size={14} />}
            onClick={() => navigate(channelPaths.content(channelId))}
          >
            View all
          </Button>
        </Stack>

        {attentionPosts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No drafts or review items right now.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {attentionPosts.map((post) => (
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

        {canMutateContent && accounts.length === 0 ? (
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Radio size={14} />}
              onClick={() => navigate(channelPaths.publishing(channelId))}
            >
              Connect account
            </Button>
          </Box>
        ) : null}
      </Paper>
    </Stack>
  );
}
