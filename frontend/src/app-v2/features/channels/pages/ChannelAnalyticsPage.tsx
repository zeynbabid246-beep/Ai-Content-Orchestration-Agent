import { Alert, CircularProgress, Stack } from "@mui/material";
import { useChannelContext } from "../hooks/useChannelContext";
import { AnalyticsSummaryView } from "../../analytics/components/AnalyticsSummaryView";
import { useChannelAnalyticsSummary } from "../../analytics/analytics.queries";

export function ChannelAnalyticsPage() {
  const { channelId } = useChannelContext();
  const { data, isLoading, isError } = useChannelAnalyticsSummary(channelId, 30);

  if (!channelId) return null;

  if (isLoading) {
    return (
      <Stack alignItems="center" py={8}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !data) {
    return <Alert severity="error">Failed to load channel analytics.</Alert>;
  }

  return (
    <AnalyticsSummaryView
      summary={data}
      title="Channel analytics"
      subtitle="PERFORMANCE FOR PUBLICATIONS IN THIS CHANNEL"
    />
  );
}
