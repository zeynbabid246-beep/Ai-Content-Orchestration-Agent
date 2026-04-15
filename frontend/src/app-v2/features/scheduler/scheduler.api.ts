import type { SchedulerEvent, SchedulerEventMap } from "./scheduler.types";

/**
 * Scheduler API layer.
 * Currently operates on in-memory state. Replace with real API calls when backend is ready.
 */

// TODO: Replace with apiRequest<SchedulerEventMap>("/scheduler/events", { requiresAuth: true })
export async function getSchedulerEvents(): Promise<SchedulerEventMap> {
  return {};
}

// TODO: Replace with apiRequest<void>("/scheduler/events", { method: "POST", requiresAuth: true, body: ... })
export async function createSchedulerEvent(dateKey: string, event: SchedulerEvent): Promise<{ dateKey: string; event: SchedulerEvent }> {
  return { dateKey, event };
}
