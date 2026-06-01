import { useMemo, useState } from "react";
import { Alert, Box, Button, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { LayoutGrid, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useCampaigns } from "../campaigns.queries";
import { useChannels } from "../../channels/channels.queries";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { CampaignCard } from "../components/CampaignCard";
import { CampaignStatus } from "../campaigns.types";
import { ROUTES, channelPaths } from "../../../shared/lib/routes";

const STATUS_FILTERS: { value: "all" | CampaignStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: CampaignStatus.Draft, label: "Draft" },
  { value: CampaignStatus.Active, label: "Active" },
  { value: CampaignStatus.Paused, label: "Paused" },
  { value: CampaignStatus.Completed, label: "Completed" },
  { value: CampaignStatus.Archived, label: "Archived" },
];

export function CampaignsListPage() {
  const navigate = useNavigate();
  const campaignsQuery = useCampaigns();
  const { data: channels = [] } = useChannels();
  const { data: allPosts = [] } = useContentPosts();

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");

  const channelNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const channel of channels) {
      map.set(channel.id, channel.name);
    }
    return map;
  }, [channels]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (campaignsQuery.data ?? []).filter((campaign) => {
      if (channelFilter !== "all" && campaign.channelId !== channelFilter) return false;
      if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
      if (term) {
        const haystack = `${campaign.name} ${campaign.description ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [campaignsQuery.data, search, channelFilter, statusFilter]);

  const postCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const post of allPosts) {
      const cid = (post as { campaignId?: number | null }).campaignId;
      if (typeof cid === "number") {
        map.set(cid, (map.get(cid) ?? 0) + 1);
      }
    }
    return map;
  }, [allPosts]);

  const campaigns = campaignsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Campaigns"
        subtitle="Editorial initiatives across all your channels. Open a channel to create new campaigns."
      />

      {campaignsQuery.isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load campaigns.
        </Alert>
      ) : null}

      {campaignsQuery.isLoading ? (
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
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
          <LayoutGrid size={22} style={{ opacity: 0.55 }} />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            No campaigns yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Campaigns live inside channels. Open a channel and create one from there.
          </Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.channels)}>
            Browse channels
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
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
              label="Channel"
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value === "all" ? "all" : Number(event.target.value)
                )
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All channels</MenuItem>
              {channels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  {channel.name}
                </MenuItem>
              ))}
            </TextField>
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
                <Box key={campaign.id}>
                  <CampaignCard
                    campaign={campaign}
                    postCount={postCounts.get(campaign.id) ?? 0}
                  />
                  {campaign.channelId ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5, ml: 0.5 }}
                    >
                      in{" "}
                      <Box
                        component="span"
                        sx={{ cursor: "pointer", color: "primary.main" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(channelPaths.overview(campaign.channelId!));
                        }}
                      >
                        {channelNameById.get(campaign.channelId) ?? `Channel #${campaign.channelId}`}
                      </Box>
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      )}
    </>
  );
}
