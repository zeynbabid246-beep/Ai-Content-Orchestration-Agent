import { useState } from "react";
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
import { getLinkedInToken, connectLinkedIn } from "./linkedin-auth";
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from "../channels/channels.queries";
import type { Channel } from "../channels/channels.types";

// ─── Platform data (static social accounts UI) ───────────────────────────────

type Platform = {
  id: string;
  name: string;
  sub: string;
  icon: string;
  stats: { posts: string; reach: string };
  connected: boolean;
};

const PLATFORMS: Platform[] = [
  { id: "linkedin", name: "LinkedIn", sub: "Professional network", icon: "in", stats: { posts: "24", reach: "8.4k" }, connected: true },
  { id: "instagram", name: "Instagram", sub: "Photo & video sharing", icon: "IG", stats: { posts: "41", reach: "12.1k" }, connected: true },
  { id: "facebook", name: "Facebook", sub: "Social engagement", icon: "f", stats: { posts: "17", reach: "5.2k" }, connected: false },
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

// ─── Platforms Tab ────────────────────────────────────────────────────────────

function PlatformsTab() {
  const [platforms, setPlatforms] = useState(PLATFORMS);

  const toggleConnect = async (id: string) => {
    if (id === "linkedin" && !platforms.find(p => p.id === "linkedin")?.connected) {
      // Simulate reading the token from our linkedin token file
      const token = await connectLinkedIn();
      if (token) {
        setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, connected: true } : p)));
        // Example: alert or save token
        console.log("Successfully connected with token:", token);
      }
    } else {
      setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p)));
    }
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
      {platforms.map((platform) => (
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

                <Chip size="small" label={platform.connected ? "Connected · Active" : "Not connected"} color={platform.connected ? "success" : "default"} sx={{ width: "fit-content", borderRadius: 1 }} />

                {platform.connected ? (
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
                      <Button variant="contained" fullWidth>Connect</Button>
                      <Button variant="outlined" fullWidth onClick={() => toggleConnect(platform.id)}>Disconnect</Button>
                    </Stack>
                  </>
                ) : (
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary" mb={2}>Connect this account to start publishing and tracking performance.</Typography>
                    <Button variant="outlined" onClick={() => toggleConnect(platform.id)}>Connect {platform.name}</Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      ))}
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
        <Tab label="Brand Studio" value="brand" />
        <Tab label="Content Type" value="content-type" />
        <Tab label="Social Accounts" value="platforms" />
      </Tabs>

      {activeTab === "channels" && <ChannelsTab />}
      {activeTab === "brand" && <BrandStudioPage />}
      {activeTab === "content-type" && <ContentTypePage />}
      {activeTab === "platforms" && <PlatformsTab />}
    </Stack>
  );
}
