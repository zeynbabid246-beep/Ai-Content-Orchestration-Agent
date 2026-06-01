import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useChannelContext } from "../hooks/useChannelContext";
import { useDeleteChannel, useUpdateChannel } from "../channels.queries";
import { CreateChannelDialog } from "../components/CreateChannelDialog";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { ROUTES } from "../../../shared/lib/routes";

export function ChannelSettingsPage() {
  const navigate = useNavigate();
  const { channelId, channel } = useChannelContext();
  const updateMutation = useUpdateChannel();
  const deleteMutation = useDeleteChannel();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!channelId || !channel) return null;

  return (
    <>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Channel settings
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            IDENTITY, BRANDING AND DANGER ZONE
          </Typography>
        </Box>

        <Paper sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "flex-start" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Channel identity
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Edit name, description, tone, operational goal and accent color.
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2">
                  <strong>{channel.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {channel.description || "No description"}
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit identity
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderColor: "error.dark" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="error.light">
                Delete this channel
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Permanently removes the channel. Connected social accounts and campaigns will need to be
                reassigned beforehand. This cannot be undone.
              </Typography>
              {deleteMutation.isError ? (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {(deleteMutation.error as Error).message}
                </Alert>
              ) : null}
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<Trash2 size={14} />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete channel
            </Button>
          </Stack>
        </Paper>
      </Stack>

      <CreateChannelDialog
        open={editOpen}
        initial={channel}
        saving={updateMutation.isPending}
        errorMessage={
          updateMutation.isError ? (updateMutation.error as Error).message : null
        }
        onClose={() => {
          if (!updateMutation.isPending) {
            setEditOpen(false);
            updateMutation.reset();
          }
        }}
        onSubmit={(payload) =>
          updateMutation.mutate(
            {
              id: channelId,
              data: {
                name: payload.name,
                description: payload.description,
                branding: payload.branding,
                config: payload.config,
              },
            },
            {
              onSuccess: () => {
                setEditOpen(false);
                updateMutation.reset();
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete channel"
        description={
          <>
            Delete <strong>{channel.name}</strong>? This action cannot be undone.
          </>
        }
        destructive
        confirmLabel="Delete"
        busy={deleteMutation.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(channelId, {
            onSuccess: () => {
              setConfirmDelete(false);
              navigate(ROUTES.channels);
            },
          })
        }
      />
    </>
  );
}
