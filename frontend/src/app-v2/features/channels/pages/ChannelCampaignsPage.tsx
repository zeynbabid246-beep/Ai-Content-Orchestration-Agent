import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChannelContext } from "../hooks/useChannelContext";
import { useCampaigns, useCreateCampaign } from "../../campaigns/campaigns.queries";
import { CampaignStatus } from "../../campaigns/campaigns.types";
import { sortByEntityOption, type EntitySortOption } from "../../../shared/lib/entityListSort";
import { EntitySortSelect } from "../../../shared/ui/EntitySortSelect";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { CampaignCard } from "../../campaigns/components/CampaignCard";
import { CreateCampaignDialog } from "../../campaigns/components/CreateCampaignDialog";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { campaignPaths } from "../../../shared/lib/routes";

const STATUS_FILTERS: { value: "all" | CampaignStatus; label: string }[] = [
  { value: "all", label: "All campaigns" },
  { value: CampaignStatus.Active, label: "Active" },
  { value: CampaignStatus.Archived, label: "Archived" },
];

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
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");
  const [sortOption, setSortOption] = useState<EntitySortOption>("updated-desc");

  const channelCampaigns = useMemo(
    () => allCampaigns.filter((campaign) => campaign.channelId === channelId),
    [allCampaigns, channelId]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filteredCampaigns = channelCampaigns.filter((campaign) => {
      if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
      if (term) {
        const haystack = `${campaign.name} ${campaign.description ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    return sortByEntityOption(filteredCampaigns, sortOption);
  }, [channelCampaigns, search, statusFilter, sortOption]);

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
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
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
              />
              <TextField
                size="small"
                select
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
                sx={{ minWidth: 160 }}
              >
                {STATUS_FILTERS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <EntitySortSelect value={sortOption} onChange={setSortOption} />
            </Stack>

            {filtered.length === 0 ? (
              <Alert severity="info">No campaigns match your filters.</Alert>
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
