import { Alert, CircularProgress, Stack } from "@mui/material";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { AnalyticsSummaryView } from "../../analytics/components/AnalyticsSummaryView";
import { useCampaignAnalyticsSummary } from "../../analytics/analytics.queries";

export function CampaignAnalyticsPage() {
  const { channelId } = useChannelContext();
  const { campaignId } = useCampaignContext();
  const { data, isLoading, isError } = useCampaignAnalyticsSummary(channelId, campaignId, 30);

  if (!channelId || !campaignId) return null;

  if (isLoading) {
    return (
      <Stack alignItems="center" py={8}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Failed to load campaign analytics.</Alert>;
  }

  return (
    <AnalyticsSummaryView
      summary={data}
      title="Campaign analytics"
      subtitle="PERFORMANCE FOR PUBLICATIONS IN THIS CAMPAIGN"
    />
  );
}
