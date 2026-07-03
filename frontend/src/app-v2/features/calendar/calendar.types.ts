export type EventStatus = "Draft" | "Scheduled" | "Published" | "Deleted";

export interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  status: EventStatus;
  campaignId: number | null;
  campaignName: string | null;
  channelId: number | null;
  isStandalone: boolean;
}

export type CalendarEventMap = Record<string, CalendarEvent[]>;
