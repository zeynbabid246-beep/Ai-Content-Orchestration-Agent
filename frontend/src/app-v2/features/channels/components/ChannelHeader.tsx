import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Megaphone, Plus, Radio, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { EntityAvatar } from "../../../shared/ui/EntityAvatar";
import { getEntityColor } from "../../../shared/lib/entityVisual";
import { ROUTES, channelPaths } from "../../../shared/lib/routes";
import { useCampaigns } from "../../campaigns/campaigns.queries";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import type { Channel } from "../channels.types";

interface ChannelHeaderProps {
  channel: Channel;
}

function parseSettings(settingsJson: string | null | undefined): Record<string, unknown> {
  if (!settingsJson) return {};
  try {
    return JSON.parse(settingsJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const navigate = useNavigate();
  const accentColor = getEntityColor(channel.id);

  const { data: campaigns = [] } = useCampaigns();
  const { data: accounts = [] } = useSocialAccounts();

  const channelCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.channelId === channel.id),
    [campaigns, channel.id]
  );

  const channelAccounts = useMemo(
    () => accounts.filter((account) => account.channelId === channel.id),
    [accounts, channel.id]
  );

  const settings = useMemo(() => parseSettings(null), []);

  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha(accentColor, 0.35),
        bgcolor: "background.paper",
        overflow: "hidden",
        mb: 3,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 0% 0%, ${alpha(accentColor, 0.18)} 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          bgcolor: accentColor,
        }}
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems={{ md: "flex-start" }}>
        <EntityAvatar name={channel.name} seed={channel.id} size={56} color={accentColor} />

        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ cursor: "pointer", color: "text.secondary" }}
            onClick={() => navigate(ROUTES.channels)}
          >
            <Typography
              variant="caption"
              sx={{ letterSpacing: 1.4, fontWeight: 600, textTransform: "uppercase" }}
            >
              Channels
            </Typography>
            <Typography variant="caption">/</Typography>
            <Typography variant="caption" color="text.primary" fontWeight={600}>
              {channel.name}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {channel.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
                {channel.description?.trim() ||
                  "No description yet. Add one in Settings so your team knows what this channel publishes."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Radio size={14} />}
                onClick={() => navigate(channelPaths.publishing(channel.id))}
              >
                Connect account
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={14} />}
                onClick={() => navigate(channelPaths.campaigns(channel.id))}
              >
                New campaign
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap mt={0.5}>
            <Chip
              size="small"
              icon={<Megaphone size={12} />}
              label={`${channelCampaigns.length} ${channelCampaigns.length === 1 ? "campaign" : "campaigns"}`}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<Radio size={12} />}
              label={`${channelAccounts.length} ${channelAccounts.length === 1 ? "account" : "accounts"}`}
              variant="outlined"
            />
            {settings.goal ? (
              <Chip
                size="small"
                icon={<Sparkles size={12} />}
                label={`Goal: ${String(settings.goal)}`}
                variant="outlined"
                sx={{ textTransform: "capitalize" }}
              />
            ) : null}
            <Chip
              size="small"
              label={`Created ${new Date(channel.createdAt).toLocaleDateString()}`}
              variant="outlined"
              sx={{ color: "text.secondary" }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
