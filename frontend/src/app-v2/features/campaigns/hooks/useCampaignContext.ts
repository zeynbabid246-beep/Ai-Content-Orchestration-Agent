import { useCampaign } from "../campaigns.queries";
import { useCampaignParam } from "./useCampaignParam";

export function useCampaignContext() {
  const campaignId = useCampaignParam();
  const query = useCampaign(campaignId ?? 0);

  return {
    campaignId,
    campaign: query.data ?? null,
    isLoading: Boolean(campaignId) && query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
