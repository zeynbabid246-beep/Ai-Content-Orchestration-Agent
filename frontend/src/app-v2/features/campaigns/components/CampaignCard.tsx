import { Stack, Typography } from "@mui/material";
import { ArrowUpRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EntityAvatar } from "../../../shared/ui/EntityAvatar";
import { getEntityColor } from "../../../shared/lib/entityVisual";
import { EntityCard } from "../../../shared/ui/EntityCard";
import { campaignPaths } from "../../../shared/lib/routes";
import type { Campaign } from "../campaigns.types";
import { CampaignStatusChip } from "./CampaignStatusChip";

interface CampaignCardProps {
  campaign: Campaign;
  postCount?: number;
}

export function CampaignCard({ campaign, postCount }: CampaignCardProps) {
  const navigate = useNavigate();
  const accent = getEntityColor(`c-${campaign.id}`);
  const channelId = campaign.channelId ?? 0;

  return (
    <EntityCard
      accentColor={accent}
      onClick={() => {
        if (channelId) {
          navigate(campaignPaths.overview(channelId, campaign.id));
        }
      }}
      leading={<EntityAvatar name={campaign.name} seed={`c-${campaign.id}`} size={40} color={accent} />}
      title={campaign.name}
      subtitle={
        <Typography variant="caption" color="text.secondary">
          Updated {new Date(campaign.updatedAt).toLocaleDateString()}
        </Typography>
      }
      trailing={
        <Stack direction="row" spacing={1} alignItems="center">
          <CampaignStatusChip status={campaign.status} />
          <ArrowUpRight size={16} style={{ opacity: 0.55 }} />
        </Stack>
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
          {campaign.description?.trim() || "No brief yet."}
        </Typography>
      }
      footer={
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
          <FileText size={14} />
          <Typography variant="caption">
            {postCount ?? 0} {postCount === 1 ? "post" : "posts"}
          </Typography>
        </Stack>
      }
    />
  );
}
