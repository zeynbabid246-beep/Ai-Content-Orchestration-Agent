import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { useDeleteCampaign, useUpdateCampaign } from "../campaigns.queries";
import { CreateCampaignDialog } from "../components/CreateCampaignDialog";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { channelPaths } from "../../../shared/lib/routes";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { ReadOnlyBanner } from "../../../shared/ui/ReadOnlyBanner";

export function CampaignSettingsPage() {
  const navigate = useNavigate();
  const { canMutateContent } = useTeamPermissions();
  const { channelId, channel } = useChannelContext();
  const { campaignId, campaign } = useCampaignContext();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!channelId || !campaignId || !campaign) return null;

  return (
    <>
      <Stack spacing={2.5}>
        {!canMutateContent ? <ReadOnlyBanner /> : null}
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Campaign settings
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            IDENTITY, BRIEF AND DANGER ZONE
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
                Campaign identity
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Edit name, brief, objective and status.
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2">
                  <strong>{campaign.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {campaign.description || "No description"}
                </Typography>
              </Box>
            </Box>
            {canMutateContent ? (
              <Button variant="outlined" onClick={() => setEditOpen(true)}>
                Edit campaign
              </Button>
            ) : null}
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
                Delete this campaign
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Permanently removes the campaign. Linked posts remain but become unlinked. This cannot be undone.
              </Typography>
              {deleteMutation.isError ? (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {(deleteMutation.error as Error).message}
                </Alert>
              ) : null}
            </Box>
            {canMutateContent ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<Trash2 size={14} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete campaign
              </Button>
            ) : null}
          </Stack>
        </Paper>
      </Stack>

      <CreateCampaignDialog
        open={editOpen}
        channelId={channelId}
        channelName={channel?.name}
        initial={campaign}
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
              id: campaignId,
              data: {
                name: payload.name,
                description: payload.description,
                channelId: payload.channelId ?? channelId,
                status: payload.status ?? campaign.status,
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
        title="Delete campaign"
        description={
          <>
            Delete <strong>{campaign.name}</strong>? This action cannot be undone.
          </>
        }
        destructive
        confirmLabel="Delete"
        busy={deleteMutation.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(campaignId, {
            onSuccess: () => {
              setConfirmDelete(false);
              navigate(channelPaths.campaigns(channelId));
            },
          })
        }
      />
    </>
  );
}
