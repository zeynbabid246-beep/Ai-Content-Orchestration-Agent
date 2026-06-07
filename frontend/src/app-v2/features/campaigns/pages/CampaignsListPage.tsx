import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { LayoutGrid, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { WorkspaceEmptyState } from "../../../shared/ui/WorkspaceEmptyState";
import { useCampaigns } from "../campaigns.queries";
import { useChannels } from "../../channels/channels.queries";
import { CampaignStatus } from "../campaigns.types";
import { CampaignProgressChips } from "../components/CampaignProgressChips";
import { campaignPaths } from "../../../shared/lib/routes";

const STATUS_FILTERS: { value: "all" | CampaignStatus; label: string }[] = [
  { value: "all", label: "All campaigns" },
  { value: CampaignStatus.Active, label: "Active" },
  { value: CampaignStatus.Archived, label: "Archived" },
];

export function CampaignsListPage() {
  const navigate = useNavigate();
  const campaignsQuery = useCampaigns();
  const { data: channels = [] } = useChannels();

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
    return (campaignsQuery.data ?? [])
      .filter((campaign) => {
        if (channelFilter !== "all" && campaign.channelId !== channelFilter) return false;
        if (statusFilter !== "all" && campaign.status !== statusFilter) return false;
        if (term) {
          const haystack = `${campaign.name} ${campaign.description ?? ""}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [campaignsQuery.data, search, channelFilter, statusFilter]);

  const campaigns = campaignsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="All campaigns"
        subtitle="All campaigns across channels. Open a row to manage posts inside the channel workspace."
      />

      {campaignsQuery.isError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load campaigns.
        </Alert>
      ) : null}

      {campaignsQuery.isLoading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Stack>
      ) : campaigns.length === 0 ? (
        <WorkspaceEmptyState
          icon={<LayoutGrid size={22} />}
          title="No campaigns yet"
          description="Campaigns are created inside a channel. Browse channels to start an initiative."
        />
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
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Channel</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell align="right">Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((campaign) => {
                    const chId = campaign.channelId;
                    return (
                      <TableRow
                        key={campaign.id}
                        hover
                        sx={{ cursor: chId ? "pointer" : "default" }}
                        onClick={() => {
                          if (chId) {
                            navigate(campaignPaths.overview(chId, campaign.id));
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {campaign.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {chId
                              ? channelNameById.get(chId) ?? `Channel #${chId}`
                              : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <CampaignProgressChips campaign={campaign} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(campaign.updatedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      )}
    </>
  );
}
