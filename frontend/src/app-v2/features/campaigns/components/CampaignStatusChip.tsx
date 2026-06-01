import { StatusChip } from "../../../shared/ui/StatusChip";
import { CampaignStatus } from "../campaigns.types";

interface CampaignStatusChipProps {
  status: CampaignStatus;
}

export function CampaignStatusChip({ status }: CampaignStatusChipProps) {
  return <StatusChip kind="campaign" status={status} />;
}
