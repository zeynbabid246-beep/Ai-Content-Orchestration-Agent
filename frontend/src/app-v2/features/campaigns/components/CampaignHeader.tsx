import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { EntityAvatar } from "../../../shared/ui/EntityAvatar";
import { getEntityColor } from "../../../shared/lib/entityVisual";
import { ROUTES, campaignPaths, channelPaths } from "../../../shared/lib/routes";
import type { Channel } from "../../channels/channels.types";
import type { Campaign } from "../campaigns.types";
import { CampaignStatusChip } from "./CampaignStatusChip";

interface CampaignHeaderProps {
  channel: Channel;
  campaign: Campaign;
}

export function CampaignHeader({ channel, campaign }: CampaignHeaderProps) {
  const navigate = useNavigate();
  const accent = getEntityColor(`c-${campaign.id}`);

  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: alpha(accent, 0.35),
        bgcolor: "background.paper",
        overflow: "hidden",
        mb: 3,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          bgcolor: accent,
        }}
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems={{ md: "flex-start" }}>
        <EntityAvatar name={campaign.name} seed={`c-${campaign.id}`} size={52} color={accent} />

        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
            <Typography
              variant="caption"
              sx={{
                letterSpacing: 1.4,
                fontWeight: 600,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
              onClick={() => navigate(ROUTES.channels)}
            >
              Channels
            </Typography>
            <Typography variant="caption">/</Typography>
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(channelPaths.overview(channel.id))}
            >
              {channel.name}
            </Typography>
            <Typography variant="caption">/</Typography>
            <Typography variant="caption" color="text.primary" fontWeight={600}>
              {campaign.name}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {campaign.name}
                </Typography>
                <CampaignStatusChip status={campaign.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                {campaign.description?.trim() || "No brief yet. Add a description in Settings."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexShrink={0}>
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={14} />}
                onClick={() => navigate(campaignPaths.newPost(channel.id, campaign.id))}
              >
                New post
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
