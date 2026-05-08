export type EventStatus = "Draft" | "Review" | "Approved" | "Scheduled" | "Published" | "Archived";

export interface SchedulerEvent {
  id?: number | string;
  title: string;
  time: string;
  status: EventStatus;
  notes: string;
  color?: string;
}

export type SchedulerEventMap = Record<string, SchedulerEvent[]>;
