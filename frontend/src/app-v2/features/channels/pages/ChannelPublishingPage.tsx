import { useEffect, useMemo, useState } from "react";
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
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link2, Plus, Radio as RadioIcon } from "lucide-react";
import { useChannelContext } from "../hooks/useChannelContext";
import {
  useChannelSocialAccounts,
  useLinkChannelSocialAccount,
  useUnlinkChannelSocialAccount,
} from "../hooks/useChannelSocialAccounts";
import { useDeleteSocialAccount } from "../../social-media/social-accounts.queries";
import { getSocialAuthLoginUrl } from "../../social-media/social-auth.api";
import { SocialPlatform, type SocialAccount } from "../../social-media/social-accounts.types";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

interface PlatformConfig {
  id: "linkedin" | "facebook" | "instagram";
  name: string;
  description: string;
  glyph: string;
  color: string;
  enumValue: SocialPlatform;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Professional network",
    glyph: "in",
    color: "#0A66C2",
    enumValue: SocialPlatform.LinkedIn,
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Pages & community",
    glyph: "f",
    color: "#1877F2",
    enumValue: SocialPlatform.Facebook,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Business / Creator account",
    glyph: "ig",
    color: "#E1306C",
    enumValue: SocialPlatform.Instagram,
  },
];

export function ChannelPublishingPage() {
  const theme = useTheme();
  const { canMutateContent } = useTeamPermissions();
  const { channelId } = useChannelContext();
  const { data, isLoading, isError, refetch } = useChannelSocialAccounts(channelId);
  const linkMutation = useLinkChannelSocialAccount(channelId ?? 0);
  const unlinkMutation = useUnlinkChannelSocialAccount(channelId ?? 0);
  const deleteTeamMutation = useDeleteSocialAccount();

  const [status, setStatus] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [linkDialogPlatform, setLinkDialogPlatform] = useState<PlatformConfig | null>(null);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("socialAuthStatus");
    if (!oauthStatus) return;

    const platform = params.get("platform");
    const error = params.get("socialAuthError");
    if (oauthStatus === "success") {
      setStatus({ severity: "success", message: `${platform ?? "Account"} connected and linked to this channel.` });
      void refetch();
    } else {
      setStatus({ severity: "error", message: error ?? "Connection failed." });
    }

    params.delete("socialAuthStatus");
    params.delete("platform");
    params.delete("socialAuthError");
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [refetch]);

  const handleConnectNew = async (platform: PlatformConfig) => {
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

  const openLinkDialog = (platform: PlatformConfig) => {
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

  const handleUnlink = (platform: PlatformConfig) => {
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

  const handleRemoveFromTeam = (platform: PlatformConfig) => {
    const account = linkedByPlatform.get(platform.enumValue);
    if (!account) return;
    deleteTeamMutation.mutate(account.id, {
      onSuccess: () => {
        setStatus({ severity: "success", message: `${platform.name} removed from team.` });
        void refetch();
      },
      onError: (err) => {
        setStatus({
          severity: "error",
          message: err instanceof Error ? err.message : "Remove failed.",
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
          LINK TEAM ACCOUNTS TO THIS CHANNEL — ONE ACCOUNT PER PLATFORM
        </Typography>
      </Box>

      {status ? (
        <Alert severity={status.severity} onClose={() => setStatus(null)}>
          {status.message}
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
          const canLinkExisting = teamCandidates.some(
            (a) => !connected || a.id !== account?.id
          );

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
                    <Button
                      fullWidth
                      variant="text"
                      color="error"
                      size="small"
                      disabled={!canMutateContent || deleteTeamMutation.isPending}
                      onClick={() => handleRemoveFromTeam(platform)}
                    >
                      Remove from team
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
                      Connect {platform.name}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Paper sx={{ p: 2.5, borderStyle: "dashed" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <RadioIcon size={18} />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              More platforms coming soon
            </Typography>
            <Typography variant="caption" color="text.secondary">
              X and Threads will appear here once full publishing support is enabled.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Dialog open={linkDialogPlatform != null} onClose={() => setLinkDialogPlatform(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Link {linkDialogPlatform?.name ?? "account"}
        </DialogTitle>
        <DialogContent>
          {linkCandidates.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No team accounts available for this platform. Use Connect to add one.
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
