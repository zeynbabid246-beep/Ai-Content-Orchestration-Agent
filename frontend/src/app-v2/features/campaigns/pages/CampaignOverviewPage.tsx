import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { CalendarRange, FileText, Plus, Sparkles } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { ContentStatus } from "../../content-posts/content-posts.types";
import { campaignPaths } from "../../../shared/lib/routes";
import { StatusChip } from "../../../shared/ui/StatusChip";
import { CampaignPlannerDialog } from "../components/CampaignPlannerDialog";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

export function CampaignOverviewPage() {
  const { canMutateContent } = useTeamPermissions();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const navigate = useNavigate();
  const { channelId } = useChannelContext();
  const { campaignId, campaign } = useCampaignContext();
  const { data: allPosts = [] } = useContentPosts();

  const posts = useMemo(
    () =>
      allPosts.filter(
        (post) => (post as { campaignId?: number | null }).campaignId === campaignId
      ),
    [allPosts, campaignId]
  );

  const upcoming = useMemo(
    () =>
      posts
        .filter((post) => post.scheduledAt && new Date(post.scheduledAt) > new Date())
        .sort(
          (a, b) =>
            new Date(a.scheduledAt ?? 0).getTime() -
            new Date(b.scheduledAt ?? 0).getTime()
        )
        .slice(0, 5),
    [posts]
  );

  const draftCount = posts.filter((p) => p.status === ContentStatus.Draft).length;
  const reviewCount = posts.filter((p) => p.status === ContentStatus.Review).length;
  const scheduledCount = posts.filter((p) => p.status === ContentStatus.Scheduled).length;
  const publishedCount = posts.filter((p) => p.status === ContentStatus.Published).length;

  if (!channelId || !campaignId || !campaign) return null;

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        }}
      >
        {[
          { label: "Drafts", value: draftCount },
          { label: "In review", value: reviewCount },
          { label: "Scheduled", value: scheduledCount },
          { label: "Published", value: publishedCount },
        ].map((stat) => (
          <Paper key={stat.label} sx={{ p: 2.25 }}>
            <Typography variant="h4" fontWeight={600}>
              {stat.value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ letterSpacing: 1, textTransform: "uppercase" }}
            >
              {stat.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
        }}
      >
        <Paper sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Editorial brief
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                WHAT THIS CAMPAIGN IS ABOUT
              </Typography>
            </Box>
          </Stack>
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.common.white, 0.03),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {campaign.description?.trim() ||
                "No brief yet. Open Settings to describe objective, audience and key messaging."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} mt={2.5} flexWrap="wrap">
            {canMutateContent ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Plus size={14} />}
                  onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
                >
                  New post
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Sparkles size={14} />}
                  onClick={() => setPlannerOpen(true)}
                >
                  Campaign planner
                </Button>
              </>
            ) : null}
            <Button
              variant="outlined"
              startIcon={<FileText size={14} />}
              onClick={() => navigate(campaignPaths.posts(channelId, campaignId))}
            >
              All posts
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Upcoming publications
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            NEXT 5 SCHEDULED
          </Typography>

          {upcoming.length === 0 ? (
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
              <CalendarRange size={20} style={{ opacity: 0.55 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Nothing scheduled yet.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1} mt={1.5}>
              {upcoming.map((post) => (
                <Stack key={post.id} direction="row" spacing={1.5} alignItems="center">
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
                    <Typography variant="caption" fontWeight={600}>
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
                      {post.title || "Untitled"}
                    </Typography>
                  </Box>
                  <StatusChip status={post.status} />
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      {posts.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
          <Sparkles size={22} style={{ opacity: 0.55 }} />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            Start drafting content
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
            Create posts inside this campaign. Each post can have multiple platform-specific variants.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
          >
            Create first post
          </Button>
        </Paper>
      ) : null}

      <CampaignPlannerDialog
        open={plannerOpen}
        campaignId={campaignId}
        channelId={channelId}
        onClose={() => setPlannerOpen(false)}
        onCompleted={() => {
          void queryClient.invalidateQueries({ queryKey: ["content-posts"] });
        }}
      />
    </Stack>
  );
}
