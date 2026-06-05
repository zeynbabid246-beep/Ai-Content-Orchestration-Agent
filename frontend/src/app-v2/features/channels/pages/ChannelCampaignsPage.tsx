import { useMemo, useState } from "react";
import { Alert, Box, Button, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChannelContext } from "../hooks/useChannelContext";
import { useCampaigns, useCreateCampaign } from "../../campaigns/campaigns.queries";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { CampaignCard } from "../../campaigns/components/CampaignCard";
import { CreateCampaignDialog } from "../../campaigns/components/CreateCampaignDialog";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { campaignPaths } from "../../../shared/lib/routes";

export function ChannelCampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageChannels } = useTeamPermissions();
  const { channelId } = useChannelContext();
  const { data: allCampaigns = [], isLoading, isError } = useCampaigns();
  const { data: allPosts = [] } = useContentPosts();
  const createMutation = useCreateCampaign();

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const channelCampaigns = useMemo(
    () => allCampaigns.filter((campaign) => campaign.channelId === channelId),
    [allCampaigns, channelId]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return channelCampaigns;
    return channelCampaigns.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(term) ||
        (campaign.description ?? "").toLowerCase().includes(term)
    );
  }, [channelCampaigns, search]);

  const postCountByCampaign = useMemo(() => {
    const map = new Map<number, number>();
    for (const post of allPosts) {
      const cid = post.campaignId;
      if (typeof cid === "number") {
        map.set(cid, (map.get(cid) ?? 0) + 1);
      }
    }
    return map;
  }, [allPosts]);

  if (!channelId) return null;

  return (
    <>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Campaigns
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
              EDITORIAL INITIATIVES INSIDE THIS CHANNEL
            </Typography>
          </Box>
          {canManageChannels ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              New campaign
            </Button>
          ) : null}
        </Stack>

        {isError ? <Alert severity="error">Failed to load campaigns.</Alert> : null}

        {isLoading ? (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
            }}
          >
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} variant="rounded" height={170} />
            ))}
          </Box>
        ) : channelCampaigns.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
            <Typography variant="h6">No campaigns in this channel</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
              Campaigns organize launches, hiring sprints, seasonal initiatives, and editorial series.
            </Typography>
            {canManageChannels ? (
              <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
                New campaign
              </Button>
            ) : null}
          </Paper>
        ) : (
          <Stack spacing={2}>
            <TextField
              size="small"
              placeholder="Search campaigns..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: "flex", color: "text.secondary", mr: 1 }}>
                    <Search size={16} />
                  </Box>
                ),
              }}
              sx={{ maxWidth: 360 }}
            />

            {filtered.length === 0 ? (
              <Alert severity="info">No campaigns match "{search}".</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                }}
              >
                {filtered.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    postCount={postCountByCampaign.get(campaign.id) ?? 0}
                  />
                ))}
              </Box>
            )}
          </Stack>
        )}
      </Stack>

      <CreateCampaignDialog
        open={createOpen}
        channelId={channelId}
        saving={createMutation.isPending}
        errorMessage={
          createMutation.isError ? (createMutation.error as Error).message : null
        }
        onClose={() => {
          if (!createMutation.isPending) {
            setCreateOpen(false);
            createMutation.reset();
          }
        }}
        onSubmit={(payload) =>
          createMutation.mutate(payload, {
            onSuccess: (created) => {
              setCreateOpen(false);
              createMutation.reset();
              void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
              navigate(`${campaignPaths.overview(channelId, created.id)}?welcome=1`);
            },
          })
        }
      />
    </>
  );
}
