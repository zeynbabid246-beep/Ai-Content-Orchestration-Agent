import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { BrandStudioPage } from "../brand-studio/BrandStudioPage";
import { ContentTypePage } from "../content-type/ContentTypePage";
import { useSocialAccounts, useDeleteSocialAccount } from "./social-accounts.queries";
import { SocialPlatform } from "./social-accounts.types";
import { getSocialAuthLoginUrl } from "./social-auth.api";
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from "../channels/channels.queries";
import type { Channel } from "../channels/channels.types";
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from "../campaigns/campaigns.queries";
import { CampaignStatus } from "../campaigns/campaigns.types";

// ─── Platform data (static social accounts UI) ───────────────────────────────

type Platform = {
  id: "linkedin" | "facebook";
  name: string;
  sub: string;
  icon: string;
  stats: { posts: string; reach: string };
};

const PLATFORMS: Platform[] = [
  { id: "linkedin", name: "LinkedIn", sub: "Professional network", icon: "in", stats: { posts: "24", reach: "8.4k" } },
  { id: "facebook", name: "Facebook", sub: "Social engagement", icon: "f", stats: { posts: "17", reach: "5.2k" } },
];

// ─── Channel colors ──────────────────────────────────────────────────────────

const CHANNEL_COLORS = [
  "#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777",
  "#0A66C2", "#E1306C", "#1877F2", "#f59e0b", "#22c55e",
];

function getChannelColor(id: number) {
  return CHANNEL_COLORS[id % CHANNEL_COLORS.length];
}

function getChannelInitials(name: string) {
  return name
    .split(/[\s_-]+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CH";
}

// ─── Create / Edit Channel Dialog ────────────────────────────────────────────

function ChannelDialog({
  open,
  channel,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  channel: Channel | null;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(channel?.name ?? "");
  const [description, setDescription] = useState(channel?.description ?? "");
  const isEdit = !!channel;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Channel" : "Create Channel"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Channel Name"
            placeholder="e.g. LinkedIn, Newsletter, Blog"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <TextField
            label="Description"
            placeholder="Brief description of this channel"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Channel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────

function DeleteDialog({
  open,
  channelName,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  channelName: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Channel</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{channelName}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Channels Tab ────────────────────────────────────────────────────────────

function ChannelsTab() {
  const { data: channels = [], isLoading, isError } = useChannels();
  const createMutation = useCreateChannel();
  const updateMutation = useUpdateChannel();
  const deleteMutation = useDeleteChannel();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editChannel, setEditChannel] = useState<Channel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);

  const handleCreate = (name: string, description: string) => {
    createMutation.mutate(
      { name, description: description || undefined },
      { onSuccess: () => setCreateDialogOpen(false) }
    );
  };

  const handleUpdate = (name: string, description: string) => {
    if (!editChannel) return;
    updateMutation.mutate(
      { id: editChannel.id, data: { name, description: description || undefined } },
      { onSuccess: () => setEditChannel(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Team Channels
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
            ORGANIZE YOUR CONTENT BY CHANNEL
          </Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setCreateDialogOpen(true)}>
          + New Channel
        </Button>
      </Stack>

      {/* Alerts */}
      {createMutation.isSuccess && (
        <Alert severity="success" onClose={() => createMutation.reset()}>
          Channel created successfully!
        </Alert>
      )}
      {createMutation.isError && (
        <Alert severity="error" onClose={() => createMutation.reset()}>
          {(createMutation.error as Error).message}
        </Alert>
      )}
      {updateMutation.isError && (
        <Alert severity="error" onClose={() => updateMutation.reset()}>
          {(updateMutation.error as Error).message}
        </Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error" onClose={() => deleteMutation.reset()}>
          {(deleteMutation.error as Error).message}
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Failed to load channels.</Alert>
      ) : channels.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" mb={1}>
            No channels yet
          </Typography>
          <Typography variant="body2" color="text.disabled" mb={3}>
            Create your first channel to organize content by platform or topic.
          </Typography>
          <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
            Create First Channel
          </Button>
        </Paper>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Channel</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: `${getChannelColor(channel.id)}22`,
                          color: getChannelColor(channel.id),
                          border: `1px solid ${getChannelColor(channel.id)}44`,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        {getChannelInitials(channel.name)}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {channel.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {channel.description || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(channel.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(channel.updatedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => setEditChannel(channel)} aria-label="Edit channel">
                        ✎
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(channel)} aria-label="Delete channel">
                        ✕
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Dialogs */}
      {createDialogOpen && (
        <ChannelDialog
          open
          channel={null}
          onClose={() => setCreateDialogOpen(false)}
          onSave={handleCreate}
          saving={createMutation.isPending}
        />
      )}
      {editChannel && (
        <ChannelDialog
          open
          channel={editChannel}
          onClose={() => setEditChannel(null)}
          onSave={handleUpdate}
          saving={updateMutation.isPending}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          open
          channelName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleteMutation.isPending}
        />
      )}
    </Stack>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignDialog({
  open,
  campaign,
  channels,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  campaign: { id: number; name: string; description: string | null; channelId: number | null; status: CampaignStatus } | null;
  channels: Channel[];
  onClose: () => void;
  onSave: (payload: { name: string; description?: string; channelId: number; status: CampaignStatus }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [channelId, setChannelId] = useState<number | "">(campaign?.channelId ?? "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? CampaignStatus.Draft);
  const isEdit = !!campaign;

  const canSubmit = Boolean(name.trim() && channelId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Campaign Name"
            fullWidth
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <TextField
            label="Channel"
            select
            required
            value={channelId}
            onChange={(event) => setChannelId(Number(event.target.value))}
          >
            {channels.map((channel) => (
              <MenuItem key={channel.id} value={channel.id}>
                {channel.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Status"
            select
            value={status}
            onChange={(event) => setStatus(event.target.value as CampaignStatus)}
          >
            <MenuItem value={CampaignStatus.Draft}>Draft</MenuItem>
            <MenuItem value={CampaignStatus.Active}>Active</MenuItem>
            <MenuItem value={CampaignStatus.Paused}>Paused</MenuItem>
            <MenuItem value={CampaignStatus.Completed}>Completed</MenuItem>
            <MenuItem value={CampaignStatus.Archived}>Archived</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canSubmit || saving}
          onClick={() => {
            if (!channelId) return;
            onSave({
              name: name.trim(),
              description: description.trim() || undefined,
              channelId,
              status,
            });
          }}
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Campaign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CampaignsTab() {
  const { data: channels = [] } = useChannels();
  const { data: campaigns = [], isLoading, isError } = useCampaigns();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<(typeof campaigns)[number] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof campaigns)[number] | null>(null);

  const channelNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const channel of channels) {
      map.set(channel.id, channel.name);
    }
    return map;
  }, [channels]);

  const handleCreate = (payload: { name: string; description?: string; channelId: number; status: CampaignStatus }) => {
    createMutation.mutate(payload, {
      onSuccess: () => setCreateDialogOpen(false),
    });
  };

  const handleUpdate = (payload: { name: string; description?: string; channelId: number; status: CampaignStatus }) => {
    if (!editCampaign) return;
    updateMutation.mutate(
      {
        id: editCampaign.id,
        data: payload,
      },
      {
        onSuccess: () => setEditCampaign(null),
      }
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Campaigns
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
            PLAN AND TRACK CHANNEL-ALIGNED CAMPAIGNS
          </Typography>
        </Box>
        <Button variant="contained" size="small" onClick={() => setCreateDialogOpen(true)} disabled={channels.length === 0}>
          + New Campaign
        </Button>
      </Stack>

      {channels.length === 0 && (
        <Alert severity="warning">Create at least one channel before creating campaigns.</Alert>
      )}

      {createMutation.isError && (
        <Alert severity="error" onClose={() => createMutation.reset()}>
          {(createMutation.error as Error).message}
        </Alert>
      )}
      {updateMutation.isError && (
        <Alert severity="error" onClose={() => updateMutation.reset()}>
          {(updateMutation.error as Error).message}
        </Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error" onClose={() => deleteMutation.reset()}>
          {(deleteMutation.error as Error).message}
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Failed to load campaigns.</Alert>
      ) : campaigns.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" mb={1}>
            No campaigns yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Create campaigns to organize content-posts inside channels.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {campaign.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {campaign.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell>{campaign.channelId ? channelNameById.get(campaign.channelId) ?? `#${campaign.channelId}` : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={campaign.status}
                      color={campaign.status === CampaignStatus.Active ? "success" : campaign.status === CampaignStatus.Paused ? "warning" : "default"}
                    />
                  </TableCell>
                  <TableCell>{new Date(campaign.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => setEditCampaign(campaign)} aria-label="Edit campaign">
                        ✎
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(campaign)} aria-label="Delete campaign">
                        ✕
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {createDialogOpen && (
        <CampaignDialog
          open
          campaign={null}
          channels={channels}
          onClose={() => setCreateDialogOpen(false)}
          onSave={handleCreate}
          saving={createMutation.isPending}
        />
      )}

      {editCampaign && (
        <CampaignDialog
          open
          campaign={editCampaign}
          channels={channels}
          onClose={() => setEditCampaign(null)}
          onSave={handleUpdate}
          saving={updateMutation.isPending}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          open
          channelName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }}
          deleting={deleteMutation.isPending}
        />
      )}
    </Stack>
  );
}

// ─── Platforms Tab ────────────────────────────────────────────────────────────

function PlatformsTab() {
  const { data: channels = [] } = useChannels();
  const { data: socialAccounts = [], isLoading, isError, refetch } = useSocialAccounts();
  const deleteSocialAccountMutation = useDeleteSocialAccount();
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!channels.length) {
      setSelectedChannelId(null);
      return;
    }

    setSelectedChannelId((current) => {
      if (current && channels.some((channel) => channel.id === current)) {
        return current;
      }
      return channels[0].id;
    });
  }, [channels]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("socialAuthStatus");
    if (!status) return;

    const platform = params.get("platform");
    const error = params.get("socialAuthError");
    if (status === "success") {
      setOauthStatus({
        severity: "success",
        message: `${platform ?? "Social account"} connected successfully.`,
      });
      void refetch();
    } else {
      setOauthStatus({
        severity: "error",
        message: error ?? "Social account connection failed.",
      });
    }

    params.delete("socialAuthStatus");
    params.delete("platform");
    params.delete("socialAuthError");
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [refetch]);

  const platformAccountMap = useMemo(() => {
    const map = new Map<SocialPlatform, typeof socialAccounts>();
    for (const account of socialAccounts) {
      if (selectedChannelId && account.channelId !== selectedChannelId) continue;
      const current = map.get(account.platform) ?? [];
      current.push(account);
      map.set(account.platform, current);
    }
    return map;
  }, [socialAccounts, selectedChannelId]);

  const connectPlatform = async (platform: Platform["id"]) => {
    if (!selectedChannelId) {
      setOauthStatus({ severity: "error", message: "Create a channel first before connecting social accounts." });
      return;
    }

    const authorizationUrl = await getSocialAuthLoginUrl(platform, selectedChannelId);
    window.location.href = authorizationUrl;
  };

  const disconnectPlatform = (platform: Platform["id"]) => {
    const mappedPlatform = platform === "linkedin" ? SocialPlatform.LinkedIn : SocialPlatform.Facebook;
    const account = (platformAccountMap.get(mappedPlatform) ?? [])[0];
    if (!account) return;
    deleteSocialAccountMutation.mutate(account.id, {
      onSuccess: () => {
        setOauthStatus({
          severity: "success",
          message: `${platform === "linkedin" ? "LinkedIn" : "Facebook"} disconnected successfully.`,
        });
      },
    });
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
      <Box sx={{ gridColumn: "1 / -1" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            label="Channel"
            select
            fullWidth
            value={selectedChannelId ?? ""}
            onChange={(event) => setSelectedChannelId(Number(event.target.value))}
            disabled={channels.length === 0}
          >
            {channels.map((channel) => (
              <MenuItem key={channel.id} value={channel.id}>
                {channel.name}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 220 }}>
            Instagram is intentionally disabled until full publishing support is implemented.
          </Typography>
        </Stack>
      </Box>

      {oauthStatus && (
        <Alert sx={{ gridColumn: "1 / -1" }} severity={oauthStatus.severity} onClose={() => setOauthStatus(null)}>
          {oauthStatus.message}
        </Alert>
      )}

      {isError && (
        <Alert sx={{ gridColumn: "1 / -1" }} severity="error">
          Failed to load social accounts.
        </Alert>
      )}

      {PLATFORMS.map((platform) => {
        const mappedPlatform = platform.id === "linkedin" ? SocialPlatform.LinkedIn : SocialPlatform.Facebook;
        const connectedAccount = (platformAccountMap.get(mappedPlatform) ?? [])[0];
        const connected = Boolean(connectedAccount);
        const busy = deleteSocialAccountMutation.isPending;

        return (
        <Box key={platform.id}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 40, height: 40, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.05)", typography: "caption", border: "1px solid", borderColor: "divider" }}>
                    {platform.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6">{platform.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{platform.sub}</Typography>
                  </Box>
                </Stack>

                <Chip
                  size="small"
                  label={connected ? "Connected · Active" : "Not connected"}
                  color={connected ? "success" : "default"}
                  sx={{ width: "fit-content", borderRadius: 1 }}
                />

                {connected ? (
                  <>
                    <Stack direction="row" spacing={1}>
                      <Box sx={{ flex: 1, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "rgba(255,255,255,0.02)" }}>
                        <Typography variant="body1" color="primary.main">{platform.stats.posts}</Typography>
                        <Typography variant="caption" color="text.secondary">Posts</Typography>
                      </Box>
                      <Box sx={{ flex: 1, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "rgba(255,255,255,0.02)" }}>
                        <Typography variant="body1" color="primary.main">{platform.stats.reach}</Typography>
                        <Typography variant="caption" color="text.secondary">Reach</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button variant="contained" fullWidth disabled>
                        Connected
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => disconnectPlatform(platform.id)}
                        disabled={busy}
                      >
                        Disconnect
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary" mb={2}>Connect this account to start publishing and tracking performance.</Typography>
                    <Button
                      variant="outlined"
                      onClick={() => void connectPlatform(platform.id)}
                      disabled={!selectedChannelId || isLoading}
                    >
                      Connect {platform.name}
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )})}
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState("channels");

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Channels & Platforms</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          MANAGE YOUR CHANNELS, BRAND IDENTITIES, AND CONNECTED PLATFORMS
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, value: string) => setActiveTab(value)}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Channels" value="channels" />
        <Tab label="Campaigns" value="campaigns" />
        <Tab label="Brand Studio" value="brand" />
        <Tab label="Content Type" value="content-type" />
        <Tab label="Social Accounts" value="platforms" />
      </Tabs>

      {activeTab === "channels" && <ChannelsTab />}
      {activeTab === "campaigns" && <CampaignsTab />}
      {activeTab === "brand" && <BrandStudioPage />}
      {activeTab === "content-type" && <ContentTypePage />}
      {activeTab === "platforms" && <PlatformsTab />}
    </Stack>
  );
}
