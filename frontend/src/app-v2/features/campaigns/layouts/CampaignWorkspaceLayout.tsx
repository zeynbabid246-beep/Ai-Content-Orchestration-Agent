import { Alert, Skeleton, Stack } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { campaignPaths, channelPaths, ROUTES } from "../../../shared/lib/routes";
import { CampaignHeader } from "../components/CampaignHeader";
import { CampaignTabs } from "../components/CampaignTabs";

export function CampaignWorkspaceLayout() {
  const location = useLocation();
  const { channelId, channel, isLoading: channelLoading } = useChannelContext();
  const { campaignId, campaign, isLoading: campaignLoading, isError } = useCampaignContext();

  if (!channelId) return <Navigate to={ROUTES.channels} replace />;
  if (!campaignId) return <Navigate to={channelPaths.campaigns(channelId)} replace />;

  if (location.pathname === campaignPaths.root(channelId, campaignId)) {
    return <Navigate to={campaignPaths.overview(channelId, campaignId)} replace />;
  }

  if (channelLoading || campaignLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={42} />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    );
  }

  if (isError || !channel || !campaign) {
    return (
      <Alert severity="error">
        Unable to load this campaign. It may have been removed or moved to another channel.
      </Alert>
    );
  }

  if (campaign.channelId !== channelId) {
    return <Navigate to={campaignPaths.overview(campaign.channelId ?? channelId, campaign.id)} replace />;
  }

  return (
    <>
      <CampaignHeader channel={channel} campaign={campaign} />
      <CampaignTabs channelId={channelId} campaignId={campaignId} />
      <Outlet />
    </>
  );
}
