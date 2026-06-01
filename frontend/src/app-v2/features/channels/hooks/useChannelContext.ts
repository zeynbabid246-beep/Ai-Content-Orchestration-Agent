import { useChannel } from "../channels.queries";
import { useChannelParam } from "./useChannelParam";

/**
 * Single hook that resolves the active channel from URL params and the
 * react-query cache. Use inside ChannelWorkspaceLayout and its descendants.
 */
export function useChannelContext() {
  const channelId = useChannelParam();
  const query = useChannel(channelId ?? 0);

  return {
    channelId,
    channel: query.data ?? null,
    isLoading: Boolean(channelId) && query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
