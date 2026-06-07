import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getChannelSocialAccounts,
  linkChannelSocialAccount,
  unlinkChannelSocialAccount,
} from "../channel-social-accounts.api";
import { socialAccountsKeys } from "../../social-media/social-accounts.queries";

export function useChannelSocialAccounts(channelId: number | null) {
  return useQuery({
    queryKey: ["channel-social-accounts", channelId],
    queryFn: () => getChannelSocialAccounts(channelId!),
    enabled: channelId != null && channelId > 0,
  });
}

export function useLinkChannelSocialAccount(channelId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (socialAccountId: number) => linkChannelSocialAccount(channelId, socialAccountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["channel-social-accounts", channelId] });
      await queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
    },
  });
}

export function useUnlinkChannelSocialAccount(channelId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (socialAccountId: number) => unlinkChannelSocialAccount(channelId, socialAccountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["channel-social-accounts", channelId] });
      await queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
    },
  });
}
