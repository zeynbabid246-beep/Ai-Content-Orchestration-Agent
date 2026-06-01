import { useParams } from "react-router-dom";

export function useCampaignParam(): number | null {
  const { campaignId } = useParams<{ campaignId?: string }>();
  if (!campaignId) return null;
  const id = Number(campaignId);
  return Number.isFinite(id) && id > 0 ? id : null;
}
