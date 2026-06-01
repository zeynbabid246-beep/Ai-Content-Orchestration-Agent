import { useMemo } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowUpRight, FileText, Megaphone, Plus, Radio, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChannelContext } from "../hooks/useChannelContext";
import { useCampaigns } from "../../campaigns/campaigns.queries";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { campaignPaths, channelPaths } from "../../../shared/lib/routes";
import { EntityAvatar } from "../../../shared/ui/EntityAvatar";
import { getEntityColor } from "../../../shared/lib/entityVisual";
import { CampaignStatusChip } from "../../campaigns/components/CampaignStatusChip";
import { StatusChip } from "../../../shared/ui/StatusChip";

interface StatTileProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
}

function StatTile({ label, value, icon, hint }: StatTileProps) {
  const theme = useTheme();
  return (
    <Paper sx={{ p: 2.25 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
      </Stack>
      <Typography variant="h4" fontWeight={600}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

export function ChannelOverviewPage() {
  const navigate = useNavigate();
  const { channelId, channel } = useChannelContext();
  const { data: allCampaigns = [] } = useCampaigns();
  const { data: allAccounts = [] } = useSocialAccounts();
  const { data: allPosts = [] } = useContentPosts();

  const campaigns = useMemo(
    () => allCampaigns.filter((campaign) => campaign.channelId === channelId),
    [allCampaigns, channelId]
  );
  const accounts = useMemo(
    () => allAccounts.filter((account) => account.channelId === channelId),
    [allAccounts, channelId]
  );
  const channelPosts = useMemo(
    () => allPosts.filter((post) => post.channelId === channelId),
    [allPosts, channelId]
  );

  const upcomingPosts = useMemo(
    () =>
      channelPosts
        .filter((post) => post.scheduledAt && new Date(post.scheduledAt) > new Date())
        .sort(
          (a, b) =>
            new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime()
        )
        .slice(0, 5),
    [channelPosts]
  );

  const recentPosts = useMemo(
    () =>
      [...channelPosts]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [channelPosts]
  );

  const recentCampaigns = useMemo(
    () =>
      [...campaigns]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 4),
    [campaigns]
  );

  if (!channelId || !channel) return null;

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <StatTile
          label="Campaigns"
          value={campaigns.length}
          icon={<Megaphone size={16} />}
        />
        <StatTile
          label="Connected accounts"
          value={accounts.length}
          icon={<Radio size={16} />}
        />
        <StatTile
          label="Content posts"
          value={channelPosts.length}
          icon={<FileText size={16} />}
        />
        <StatTile
          label="Upcoming"
          value={upcomingPosts.length}
          icon={<TrendingUp size={16} />}
          hint="scheduled posts"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 2.5,
        }}
      >
        <Paper sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Recent campaigns
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                LATEST EDITORIAL INITIATIVES
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Plus size={14} />}
              onClick={() => navigate(channelPaths.campaigns(channelId))}
            >
              New campaign
            </Button>
          </Stack>

          {recentCampaigns.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No campaigns yet. Create your first one to start organizing editorial work.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {recentCampaigns.map((campaign) => (
                <Paper
                  key={campaign.id}
                  variant="outlined"
                  onClick={() =>
                    navigate(campaignPaths.overview(channelId, campaign.id))
                  }
                  sx={{
                    p: 1.5,
                    cursor: "pointer",
                    transition: "border-color 0.18s",
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
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {campaign.name}
                      </Typography>
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
                        {campaign.description?.trim() || "No description"}
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
          <Typography variant="subtitle1" fontWeight={600}>
            Upcoming publications
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            NEXT 5 SCHEDULED
          </Typography>

          {upcomingPosts.length === 0 ? (
            <Box
              sx={{
                mt: 2,
                py: 3,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Nothing scheduled yet.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1} mt={1.5}>
              {upcomingPosts.map((post) => (
                <Stack
                  key={post.id}
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{ py: 0.75 }}
                >
                  <Box
                    sx={{
                      minWidth: 56,
                      px: 0.75,
                      py: 0.5,
                      borderRadius: 0.75,
                      border: "1px solid",
                      borderColor: "divider",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} sx={{ display: "block" }}>
                      {new Date(post.scheduledAt ?? "").toLocaleDateString(undefined, {
                        month: "short",
                        day: "2-digit",
                      })}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.title || "Untitled post"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(post.scheduledAt ?? "").toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                  <StatusChip status={post.status} />
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Recent posts
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
              LATEST EDITORIAL ACTIVITY
            </Typography>
          </Box>
          <Button
            size="small"
            variant="text"
            onClick={() => navigate(channelPaths.content(channelId))}
            endIcon={<ArrowUpRight size={14} />}
          >
            View all
          </Button>
        </Stack>

        {recentPosts.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Sparkles size={20} style={{ opacity: 0.55 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No posts yet. Create a campaign and start drafting content inside it.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
            {recentPosts.map((post) => (
              <Stack
                key={post.id}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ py: 1.25 }}
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
                    {post.title || "Untitled post"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated {new Date(post.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
                <StatusChip status={post.status} />
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
