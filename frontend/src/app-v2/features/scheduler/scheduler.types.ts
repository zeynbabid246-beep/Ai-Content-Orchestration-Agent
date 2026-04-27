export type EventStatus = "Draft" | "Ready" | "Scheduled" | "Published" | "Deleted";

export interface SchedulerEvent {
  id?: number | string;
  title: string;
  time: string;
  status: EventStatus;
  notes: string;
  color?: string;
}

export type SchedulerEventMap = Record<string, SchedulerEvent[]>;
