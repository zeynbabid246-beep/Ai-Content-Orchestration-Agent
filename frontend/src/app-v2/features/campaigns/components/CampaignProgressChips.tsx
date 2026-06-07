import { Chip, Stack, Typography } from "@mui/material";
import { CampaignStatus, type Campaign } from "../campaigns.types";
import { formatCampaignProgress } from "../campaigns.display";

interface CampaignProgressChipsProps {
  campaign: Pick<Campaign, "status" | "postSummary">;
}

export function CampaignProgressChips({ campaign }: CampaignProgressChipsProps) {
  const progressLabel = formatCampaignProgress(campaign.postSummary);

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
      <Typography variant="caption" color="text.secondary">
        {progressLabel ?? "No posts yet"}
      </Typography>
      {campaign.status === CampaignStatus.Archived ? (
        <Chip size="small" label="Archived" variant="outlined" sx={{ borderRadius: 1 }} />
      ) : null}
    </Stack>
  );
}
