import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Plus, Radio } from "lucide-react";
import { useChannelContext } from "../hooks/useChannelContext";
import {
  useDeleteSocialAccount,
  useSocialAccounts,
} from "../../social-media/social-accounts.queries";
import { getSocialAuthLoginUrl } from "../../social-media/social-auth.api";
import { SocialPlatform } from "../../social-media/social-accounts.types";

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
    description: "Business account via Meta",
    glyph: "ig",
    color: "#E4405F",
    enumValue: SocialPlatform.Instagram,
  },
];

export function ChannelPublishingPage() {
  const theme = useTheme();
  const { channelId } = useChannelContext();
  const { data: allAccounts = [], isLoading, isError, refetch } = useSocialAccounts();
  const deleteMutation = useDeleteSocialAccount();

  const [status, setStatus] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const accountsByPlatform = useMemo(() => {
    const map = new Map<SocialPlatform, typeof allAccounts>();
    for (const account of allAccounts) {
      if (account.channelId !== channelId) continue;
      const list = map.get(account.platform) ?? [];
      list.push(account);
      map.set(account.platform, list);
    }
    return map;
  }, [allAccounts, channelId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("socialAuthStatus");
    if (!oauthStatus) return;

    const platform = params.get("platform");
    const error = params.get("socialAuthError");
    if (oauthStatus === "success") {
      // Reading OAuth callback params from the URL is an inherently effectful sync from an external system.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus({ severity: "success", message: `${platform ?? "Account"} connected successfully.` });
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

  const handleConnect = async (platform: PlatformConfig) => {
    if (!channelId) return;
    try {
      const authorizationUrl = await getSocialAuthLoginUrl(platform.id, channelId);
      window.location.assign(authorizationUrl);
    } catch (err) {
      setStatus({
        severity: "error",
        message: err instanceof Error ? err.message : `Could not start ${platform.name} auth.`,
      });
    }
  };

  const handleDisconnect = (platform: PlatformConfig) => {
    const account = (accountsByPlatform.get(platform.enumValue) ?? [])[0];
    if (!account) return;
    deleteMutation.mutate(account.id, {
      onSuccess: () => {
        setStatus({ severity: "success", message: `${platform.name} disconnected.` });
      },
      onError: (err) => {
        setStatus({
          severity: "error",
          message: err instanceof Error ? err.message : "Disconnect failed.",
        });
      },
    });
  };

  if (!channelId) return null;

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Publishing identities
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          CONNECTED SOCIAL ACCOUNTS USED TO DELIVER THIS CHANNEL'S CONTENT
        </Typography>
      </Box>

      {status ? (
        <Alert severity={status.severity} onClose={() => setStatus(null)}>
          {status.message}
        </Alert>
      ) : null}

      {isError ? <Alert severity="error">Failed to load connected accounts.</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {PLATFORMS.map((platform) => {
          const account = (accountsByPlatform.get(platform.enumValue) ?? [])[0];
          const connected = Boolean(account);

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
                    label={connected ? "Connected" : "Not connected"}
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
                    <Stack direction="row" spacing={1}>
                      <Button fullWidth variant="contained" disabled>
                        Active
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDisconnect(platform)}
                      >
                        Disconnect
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      Connect a {platform.name} account so this channel can publish content through it.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Plus size={14} />}
                      disabled={isLoading}
                      onClick={() => void handleConnect(platform)}
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
          <Radio size={18} />
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

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Connection requirements
        </Typography>
        <Stack spacing={0.75}>
          <Typography variant="caption" color="text.secondary">
            LinkedIn: app scopes `w_member_social`, `openid`, `profile`, `email` must be enabled.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Instagram: use a Business/Creator account linked to a Facebook Page with Meta permissions approved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            If connection fails, verify redirect URI values match provider app configuration.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
