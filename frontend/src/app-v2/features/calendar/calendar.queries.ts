import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contentPostsKeys } from "../content-posts/content-posts.queries";
import { getCampaigns } from "../campaigns/campaigns.api";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./calendar.api";
import type { CalendarEvent, EventStatus } from "./calendar.types";

export const calendarKeys = {
  events: ["calendar", "events"] as const,
};

async function fetchCalendarEvents() {
  const campaigns = await getCampaigns();
  const campaignNameById = new Map(campaigns.map((c) => [c.id, c.name]));
  return getCalendarEvents(campaignNameById);
}

export function useCalendarEventsQuery() {
  return useQuery({
    queryKey: calendarKeys.events,
    queryFn: fetchCalendarEvents,
  });
}

function invalidateCalendarCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: calendarKeys.events });
  queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
}

export function useCreateCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dateKey,
      event,
    }: {
      dateKey: string;
      event: { title: string; time: string; status: EventStatus; notes?: string };
    }) => createCalendarEvent(dateKey, event),
    onSuccess: () => {
      invalidateCalendarCaches(queryClient);
    },
  });
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dateKey,
      event,
    }: {
      dateKey: string;
      event: CalendarEvent & { notes?: string };
    }) => updateCalendarEvent(dateKey, event),
    onSuccess: () => {
      invalidateCalendarCaches(queryClient);
    },
  });
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCalendarEvent(id),
    onSuccess: () => {
      invalidateCalendarCaches(queryClient);
    },
  });
}
