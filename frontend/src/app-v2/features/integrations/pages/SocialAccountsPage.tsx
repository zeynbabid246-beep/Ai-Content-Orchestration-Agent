import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChannels } from "../../channels/channels.queries";
import {
  linkChannelSocialAccount,
  unlinkChannelSocialAccount,
} from "../../channels/channel-social-accounts.api";
import { useSocialAccounts, useDeleteSocialAccount, socialAccountsKeys } from "../../social-media/social-accounts.queries";
import { getSocialAuthLoginUrl } from "../../social-media/social-auth.api";
import { PLATFORMS } from "../../social-media/platformConfig";
import { useSocialAuthCallback } from "../../social-media/hooks/useSocialAuthCallback";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import { ROUTES } from "../../../shared/lib/routes";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { ReadOnlyBanner } from "../../../shared/ui/ReadOnlyBanner";

export function SocialAccountsPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { canMutateContent } = useTeamPermissions();
  const { data: accounts = [], isLoading, isError, refetch } = useSocialAccounts();
  const { data: channels = [] } = useChannels();

  const [manageAccount, setManageAccount] = useState<SocialAccount | null>(null);
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<SocialAccount | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const channelNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const channel of channels) {
      map.set(channel.id, channel.name);
    }
    return map;
  }, [channels]);

  const accountsByPlatform = useMemo(() => {
    const map = new Map<string, SocialAccount[]>();
    for (const account of accounts) {
      const list = map.get(account.platform) ?? [];
      list.push(account);
      map.set(account.platform, list);
    }
    return map;
  }, [accounts]);

  const handleOAuthSuccess = useCallback(() => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["channel-social-accounts"] });
  }, [queryClient, refetch]);

  const { status: oauthStatus, setStatus: setOauthStatus } = useSocialAuthCallback(handleOAuthSuccess);

  const linkMutation = useMutation({
    mutationFn: ({ channelId, socialAccountId }: { channelId: number; socialAccountId: number }) =>
      linkChannelSocialAccount(channelId, socialAccountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["channel-social-accounts"] });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ channelId, socialAccountId }: { channelId: number; socialAccountId: number }) =>
      unlinkChannelSocialAccount(channelId, socialAccountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["channel-social-accounts"] });
    },
  });

  const deleteMutation = useDeleteSocialAccount();

  const handleConnect = async (platformId: (typeof PLATFORMS)[number]["id"]) => {
    try {
      setActionError(null);
      const authorizationUrl = await getSocialAuthLoginUrl(platformId, {
        redirectPath: ROUTES.integrationsSocialAccounts,
      });
      window.location.assign(authorizationUrl);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not start OAuth.");
    }
  };

  const openManageLinks = (account: SocialAccount) => {
    setManageAccount(account);
    setSelectedChannelIds([...account.linkedChannelIds]);
  };

  const toggleChannel = (channelId: number) => {
    setSelectedChannelIds((current) =>
      current.includes(channelId) ? current.filter((id) => id !== channelId) : [...current, channelId]
    );
  };

  const handleSaveLinks = async () => {
    if (!manageAccount) return;
    setActionError(null);

    const current = new Set(manageAccount.linkedChannelIds);
    const next = new Set(selectedChannelIds);
    const toLink = [...next].filter((id) => !current.has(id));
    const toUnlink = [...current].filter((id) => !next.has(id));

    try {
      for (const channelId of toLink) {
        await linkMutation.mutateAsync({ channelId, socialAccountId: manageAccount.id });
      }
      for (const channelId of toUnlink) {
        await unlinkMutation.mutateAsync({ channelId, socialAccountId: manageAccount.id });
      }
      setManageAccount(null);
      void refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update channel links.");
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => {
        setConfirmDelete(null);
        void refetch();
      },
      onError: (err) => {
        setActionError(err instanceof Error ? err.message : "Could not disconnect account.");
      },
    });
  };

  const linksPending = linkMutation.isPending || unlinkMutation.isPending;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Social accounts
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          TEAM-LEVEL CONNECTIONS — LINK TO CHANNELS FROM HERE OR CHANNEL PUBLISHING
        </Typography>
      </Box>

      {!canMutateContent ? <ReadOnlyBanner /> : null}

      {oauthStatus ? (
        <Alert severity={oauthStatus.severity} onClose={() => setOauthStatus(null)}>
          {oauthStatus.message}
        </Alert>
      ) : null}

      {actionError ? (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      {isError ? <Alert severity="error">Failed to load social accounts.</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {PLATFORMS.map((platform) => {
          const platformAccounts = accountsByPlatform.get(platform.enumValue) ?? [];
          const hasAccounts = platformAccounts.length > 0;

          return (
            <Paper key={platform.id} sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(platform.color, 0.15),
                      color: platform.color,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {platform.glyph}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {platform.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {platform.description}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={hasAccounts ? `${platformAccounts.length} connected` : "Not connected"}
                    color={hasAccounts ? "success" : "default"}
                    variant={hasAccounts ? "filled" : "outlined"}
                  />
                </Stack>

                {hasAccounts ? (
                  <Stack spacing={1.25}>
                    {platformAccounts.map((account) => (
                      <Box
                        key={account.id}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.common.white, 0.03),
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {account.displayName || account.accountHandle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {account.linkedChannelIds.length > 0
                            ? `Linked to ${account.linkedChannelIds
                                .map((id) => channelNameById.get(id) ?? `Channel #${id}`)
                                .join(", ")}`
                            : "Not linked to any channel"}
                        </Typography>
                        {canMutateContent ? (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Link2 size={12} />}
                              onClick={() => openManageLinks(account)}
                            >
                              Manage links
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Trash2 size={12} />}
                              onClick={() => setConfirmDelete(account)}
                            >
                              Disconnect
                            </Button>
                          </Stack>
                        ) : null}
                      </Box>
                    ))}
                    {canMutateContent ? (
                      <Button
                        variant="outlined"
                        startIcon={<Plus size={14} />}
                        disabled={isLoading}
                        onClick={() => void handleConnect(platform.id)}
                      >
                        Connect another
                      </Button>
                    ) : null}
                  </Stack>
                ) : canMutateContent ? (
                  <Button
                    variant="contained"
                    startIcon={<Plus size={14} />}
                    disabled={isLoading}
                    onClick={() => void handleConnect(platform.id)}
                  >
                    Connect {platform.name}
                  </Button>
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={manageAccount != null} onClose={() => setManageAccount(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Channel links</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose which channels use{" "}
            <strong>{manageAccount?.displayName || manageAccount?.accountHandle}</strong> for publishing.
          </Typography>
          {channels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No channels yet. Create a channel under Operations to link this account.
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {channels.map((channel) => (
                <FormControlLabel
                  key={channel.id}
                  control={
                    <Checkbox
                      checked={selectedChannelIds.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                    />
                  }
                  label={channel.name}
                />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageAccount(null)}>Cancel</Button>
          <Button variant="contained" disabled={linksPending} onClick={() => void handleSaveLinks()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete != null} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Disconnect account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This removes{" "}
            <strong>{confirmDelete?.displayName || confirmDelete?.accountHandle}</strong> from your team and
            unlinks it from all channels. You can reconnect later via OAuth.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending} onClick={handleDelete}>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
