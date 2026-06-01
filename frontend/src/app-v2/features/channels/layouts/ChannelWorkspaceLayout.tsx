import { Alert, Skeleton, Stack } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES, channelPaths } from "../../../shared/lib/routes";
import { ChannelHeader } from "../components/ChannelHeader";
import { ChannelTabs } from "../components/ChannelTabs";
import { useChannelContext } from "../hooks/useChannelContext";

export function ChannelWorkspaceLayout() {
  const location = useLocation();
  const { channelId, channel, isLoading, isError } = useChannelContext();

  if (!channelId) {
    return <Navigate to={ROUTES.channels} replace />;
  }

  if (location.pathname === channelPaths.root(channelId)) {
    return <Navigate to={channelPaths.overview(channelId)} replace />;
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={150} />
        <Skeleton variant="rounded" height={42} />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    );
  }

  if (isError || !channel) {
    return (
      <Alert severity="error">
        Unable to load this channel. It may have been removed or you no longer have access.
      </Alert>
    );
  }

  return (
    <>
      <ChannelHeader channel={channel} />
      <ChannelTabs channelId={channelId} />
      <Outlet />
    </>
  );
}
