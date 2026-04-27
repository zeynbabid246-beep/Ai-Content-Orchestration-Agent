import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChannels, getChannelById, createChannel, updateChannel, deleteChannel } from "./channels.api";
import type { CreateChannelRequest, UpdateChannelRequest } from "./channels.types";

export const channelsKeys = {
  all: ["channels"] as const,
  lists: () => [...channelsKeys.all, "list"] as const,
  list: (filters: string) => [...channelsKeys.lists(), { filters }] as const,
  details: () => [...channelsKeys.all, "detail"] as const,
  detail: (id: number) => [...channelsKeys.details(), id] as const,
};

export function useChannels() {
  return useQuery({
    queryKey: channelsKeys.lists(),
    queryFn: getChannels,
  });
}

export function useChannel(id: number) {
  return useQuery({
    queryKey: channelsKeys.detail(id),
    queryFn: () => getChannelById(id),
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateChannelRequest) => createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelsKeys.lists() });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateChannelRequest }) => updateChannel(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: channelsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: channelsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelsKeys.lists() });
    },
  });
}