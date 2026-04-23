// src/app-v2/features/channels/channels.queries.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
} from "./channels.api";
import type { UpdateChannelRequest } from "./channels.types";

export const channelKeys = {
  all: ["channels"] as const,
};

export function useChannelsQuery() {
  return useQuery({
    queryKey: channelKeys.all,
    queryFn: getChannels,
  });
}

export function useCreateChannelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChannel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.all }),
  });
}

export function useUpdateChannelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, ...payload }: UpdateChannelRequest & { channelId: number }) =>
      updateChannel(channelId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.all }),
  });
}

export function useDeleteChannelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.all }),
  });
}
