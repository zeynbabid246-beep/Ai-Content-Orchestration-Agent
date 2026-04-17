export type EventStatus = "pending" | "progress" | "done";

export interface SchedulerEvent {
  title: string;
  time: string;
  status: EventStatus;
  notes: string;
  color: string;
}

export type SchedulerEventMap = Record<string, SchedulerEvent[]>;
