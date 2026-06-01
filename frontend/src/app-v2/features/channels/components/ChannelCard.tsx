import { Box, Stack, Typography } from "@mui/material";
import { ArrowUpRight, Megaphone, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EntityAvatar } from "../../../shared/ui/EntityAvatar";
import { getEntityColor } from "../../../shared/lib/entityVisual";
import { EntityCard } from "../../../shared/ui/EntityCard";
import { channelPaths } from "../../../shared/lib/routes";
import type { Channel } from "../channels.types";

interface ChannelCardProps {
  channel: Channel;
  campaignCount?: number;
  accountCount?: number;
}

export function ChannelCard({ channel, campaignCount, accountCount }: ChannelCardProps) {
  const navigate = useNavigate();
  const color = getEntityColor(channel.id);

  return (
    <EntityCard
      accentColor={color}
      onClick={() => navigate(channelPaths.overview(channel.id))}
      leading={<EntityAvatar name={channel.name} seed={channel.id} size={42} />}
      title={channel.name}
      subtitle={
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
          <Typography variant="caption">Channel</Typography>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              bgcolor: "text.disabled",
            }}
          />
          <Typography variant="caption">
            Updated {new Date(channel.updatedAt).toLocaleDateString()}
          </Typography>
        </Stack>
      }
      trailing={
        <Box
          sx={{
            color: "text.secondary",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowUpRight size={16} />
        </Box>
      }
      body={
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 36,
          }}
        >
          {channel.description?.trim() || "No description yet."}
        </Typography>
      }
      footer={
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
            <Megaphone size={14} />
            <Typography variant="caption">
              {campaignCount ?? 0} {campaignCount === 1 ? "campaign" : "campaigns"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
            <Radio size={14} />
            <Typography variant="caption">
              {accountCount ?? 0} {accountCount === 1 ? "account" : "accounts"}
            </Typography>
          </Stack>
        </Stack>
      }
    />
  );
}
