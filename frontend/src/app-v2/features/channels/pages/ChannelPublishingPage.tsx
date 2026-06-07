import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link2, Plus } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useChannelContext } from "../hooks/useChannelContext";
import {
  useChannelSocialAccounts,
  useLinkChannelSocialAccount,
  useUnlinkChannelSocialAccount,
} from "../hooks/useChannelSocialAccounts";
import { getSocialAuthLoginUrl } from "../../social-media/social-auth.api";
import { PLATFORMS } from "../../social-media/platformConfig";
import { useSocialAuthCallback } from "../../social-media/hooks/useSocialAuthCallback";
import { SocialPlatform, type SocialAccount } from "../../social-media/social-accounts.types";
import { ROUTES } from "../../../shared/lib/routes";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

export function ChannelPublishingPage() {
  const theme = useTheme();
  const { canMutateContent } = useTeamPermissions();
  const { channelId } = useChannelContext();
  const { data, isLoading, isError, refetch } = useChannelSocialAccounts(channelId);
  const linkMutation = useLinkChannelSocialAccount(channelId ?? 0);
  const unlinkMutation = useUnlinkChannelSocialAccount(channelId ?? 0);

  const [status, setStatus] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [linkDialogPlatform, setLinkDialogPlatform] = useState<(typeof PLATFORMS)[number] | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const linkedByPlatform = useMemo(() => {
    const map = new Map<SocialPlatform, SocialAccount>();
    for (const account of data?.linkedAccounts ?? []) {
      map.set(account.platform, account);
    }
    return map;
  }, [data?.linkedAccounts]);

  const linkableByPlatform = useMemo(() => {
    const map = new Map<SocialPlatform, SocialAccount[]>();
    for (const account of data?.availableTeamAccounts ?? []) {
      const list = map.get(account.platform) ?? [];
      list.push(account);
      map.set(account.platform, list);
    }
    return map;
  }, [data?.availableTeamAccounts]);

  const { status: oauthStatus, setStatus: setOauthStatus } = useSocialAuthCallback(
    () => {
      void refetch();
    },
    (platform) => `${platform ?? "Account"} connected and linked to this channel.`
  );

  const displayStatus = status ?? oauthStatus;

  const handleConnectNew = async (platform: (typeof PLATFORMS)[number]) => {
    if (!channelId) return;
    try {
      const authorizationUrl = await getSocialAuthLoginUrl(platform.id, { linkChannelId: channelId });
      window.location.assign(authorizationUrl);
    } catch (err) {
      setStatus({
        severity: "error",
        message: err instanceof Error ? err.message : `Could not start ${platform.name} auth.`,
      });
    }
  };

  const openLinkDialog = (platform: (typeof PLATFORMS)[number]) => {
    const candidates = (linkableByPlatform.get(platform.enumValue) ?? []).filter(
      (a) => !linkedByPlatform.has(platform.enumValue) || linkedByPlatform.get(platform.enumValue)?.id !== a.id
    );
    setSelectedAccountId(candidates[0]?.id ?? null);
    setLinkDialogPlatform(platform);
  };

  const handleLinkExisting = () => {
    if (!linkDialogPlatform || selectedAccountId == null) return;
    linkMutation.mutate(selectedAccountId, {
      onSuccess: () => {
        setStatus({ severity: "success", message: `${linkDialogPlatform.name} linked to this channel.` });
        setLinkDialogPlatform(null);
      },
      onError: (err) => {
        setStatus({
          severity: "error",
          message: err instanceof Error ? err.message : "Could not link account.",
        });
      },
    });
  };

  const handleUnlink = (platform: (typeof PLATFORMS)[number]) => {
    const account = linkedByPlatform.get(platform.enumValue);
    if (!account) return;
    unlinkMutation.mutate(account.id, {
      onSuccess: () => {
        setStatus({ severity: "success", message: `${platform.name} unlinked from this channel.` });
      },
      onError: (err) => {
        setStatus({
          severity: "error",
          message: err instanceof Error ? err.message : "Unlink failed.",
        });
      },
    });
  };

  if (!channelId) return null;

  const linkCandidates =
    linkDialogPlatform == null
      ? []
      : (linkableByPlatform.get(linkDialogPlatform.enumValue) ?? []).filter(
          (a) => linkedByPlatform.get(linkDialogPlatform.enumValue)?.id !== a.id
        );

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Publishing identities
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          ASSIGN TEAM ACCOUNTS TO THIS CHANNEL — ONE ACCOUNT PER PLATFORM
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Connect or disconnect credentials in{" "}
          <Link component={RouterLink} to={ROUTES.integrationsSocialAccounts}>
            Integrations → Social Accounts
          </Link>
          .
        </Typography>
      </Box>

      {displayStatus ? (
        <Alert
          severity={displayStatus.severity}
          onClose={() => {
            setStatus(null);
            setOauthStatus(null);
          }}
        >
          {displayStatus.message}
        </Alert>
      ) : null}

      {isError ? <Alert severity="error">Failed to load channel publishing accounts.</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {PLATFORMS.map((platform) => {
          const account = linkedByPlatform.get(platform.enumValue);
          const connected = Boolean(account);
          const teamCandidates = linkableByPlatform.get(platform.enumValue) ?? [];
          const canLinkExisting = teamCandidates.some((a) => !connected || a.id !== account?.id);

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
                      letterSpacing: 0.5,
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
                    label={connected ? "Linked" : "Not linked"}
                    color={connected ? "success" : "default"}
                    variant={connected ? "filled" : "outlined"}
                  />
                </Stack>

                {connected && account ? (
                  <Stack spacing={1.25}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.common.white, 0.03),
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Linked as
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {account.displayName || account.accountHandle}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      disabled={!canMutateContent || unlinkMutation.isPending}
                      onClick={() => handleUnlink(platform)}
                    >
                      Unlink from channel
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    {canLinkExisting ? (
                      <Button
                        variant="outlined"
                        startIcon={<Link2 size={14} />}
                        disabled={!canMutateContent || isLoading}
                        onClick={() => openLinkDialog(platform)}
                      >
                        Link existing account
                      </Button>
                    ) : null}
                    <Button
                      variant="contained"
                      startIcon={<Plus size={14} />}
                      disabled={!canMutateContent || isLoading}
                      onClick={() => void handleConnectNew(platform)}
                    >
                      Connect &amp; link {platform.name}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={linkDialogPlatform != null} onClose={() => setLinkDialogPlatform(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Link {linkDialogPlatform?.name ?? "account"}</DialogTitle>
        <DialogContent>
          {linkCandidates.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No team accounts available for this platform. Connect one in{" "}
              <Link component={RouterLink} to={ROUTES.integrationsSocialAccounts}>
                Social Accounts
              </Link>
              .
            </Typography>
          ) : (
            <RadioGroup
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            >
              {linkCandidates.map((candidate) => (
                <FormControlLabel
                  key={candidate.id}
                  value={candidate.id}
                  control={<Radio />}
                  label={candidate.displayName || candidate.accountHandle}
                />
              ))}
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogPlatform(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={selectedAccountId == null || linkMutation.isPending}
            onClick={handleLinkExisting}
          >
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
