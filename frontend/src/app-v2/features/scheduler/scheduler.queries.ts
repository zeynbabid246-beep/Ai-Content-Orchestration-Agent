import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSchedulerEvents, createSchedulerEvent, updateSchedulerEvent, deleteSchedulerEvent } from "./scheduler.api";

export const schedulerKeys = {
  events: ["scheduler", "events"] as const,
};

export function useSchedulerEventsQuery() {
  return useQuery({
    queryKey: schedulerKeys.events,
    queryFn: getSchedulerEvents,
  });
}

export function useCreateSchedulerEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dateKey, event }: { dateKey: string; event: any }) =>
      createSchedulerEvent(dateKey, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulerKeys.events });
    },
  });
}

export function useUpdateSchedulerEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dateKey, event }: { dateKey: string; event: any }) =>
      updateSchedulerEvent(dateKey, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulerKeys.events });
    },
  });
}

export function useDeleteSchedulerEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteSchedulerEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulerKeys.events });
    },
  });
}
