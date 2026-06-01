import { useParams } from "react-router-dom";

/**
 * Resolves the :channelId route param to a numeric id.
 * Returns null when the param is missing or not numeric.
 */
export function useChannelParam(): number | null {
  const { channelId } = useParams<{ channelId?: string }>();
  if (!channelId) return null;
  const id = Number(channelId);
  return Number.isFinite(id) && id > 0 ? id : null;
}
