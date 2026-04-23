import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { SchedulerEvent, SchedulerEventMap, EventStatus } from "./scheduler.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

// TODO: Replace with apiRequest<SchedulerEventMap>("/scheduler/events", { requiresAuth: true })
export async function getSchedulerEvents(): Promise<SchedulerEventMap> {
  const teamId = getTeamId();
  const posts = await apiRequest<any[]>(`/teams/${teamId}/content-posts`, {
    requiresAuth: true,
  });

  const map: SchedulerEventMap = {};
  
  for (const post of posts) {
    if (!post.scheduledAt) continue; 
    
    const dateObj = new Date(post.scheduledAt);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    
    const h = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    
    let status: EventStatus = "pending";
    if (post.status === 2 || post.status === 1) status = "progress";
    if (post.status === 3) status = "done";

    let notes = "";
    let color = "#1976d2";
    try {
      const parsed = JSON.parse(post.contentJson);
      if (parsed.notes) notes = parsed.notes;
      if (parsed.color) color = parsed.color;
    } catch {
      notes = post.contentJson || "";
    }

    const event: SchedulerEvent = {
       id: post.id,
       title: post.title || "Untitled",
       time: `${h}:${min}`,
       status,
       notes,
       color
    };

    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(event);
  }

  return map;
}

export async function createSchedulerEvent(dateKey: string, event: SchedulerEvent): Promise<{ dateKey: string; event: SchedulerEvent }> {
  const teamId = getTeamId();
  
  const rawData = {
    title: event.title,
    contentType: 0, 
    contentJson: JSON.stringify({ notes: event.notes, color: event.color }),
  };

  const createdPost = await apiRequest<any>(`/teams/${teamId}/content-posts`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(rawData),
  });

  const [hours, minutes] = event.time.split(":").map(Number);
  const [yy, mm, dd] = dateKey.split("-").map(Number);
  const scheduledDate = new Date(Date.UTC(yy, mm - 1, dd, hours, minutes));

  await apiRequest<any>(`/teams/${teamId}/content-posts/${createdPost.id}/workflow/schedule`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ scheduledAt: scheduledDate.toISOString() }),
  });

  return { dateKey, event: { ...event, id: createdPost.id } };
}

export async function updateSchedulerEvent(dateKey: string, event: SchedulerEvent): Promise<{ dateKey: string; event: SchedulerEvent }> {
  const teamId = getTeamId();
  
  let mappedStatus = 0; // Draft
  if (event.status === "progress") mappedStatus = 2; // Scheduled
  if (event.status === "done") mappedStatus = 3; // Published
  
  const rawData = {
    title: event.title,
    contentType: 0, 
    contentJson: JSON.stringify({ notes: event.notes, color: event.color }),
    status: mappedStatus
  };

  await apiRequest<any>(`/teams/${teamId}/content-posts/${event.id}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(rawData),
  });

  const [hours, minutes] = event.time.split(":").map(Number);
  const [yy, mm, dd] = dateKey.split("-").map(Number);
  const scheduledDate = new Date(Date.UTC(yy, mm - 1, dd, hours, minutes));

  await apiRequest<any>(`/teams/${teamId}/content-posts/${event.id}/workflow/schedule`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ scheduledAt: scheduledDate.toISOString() }),
  });

  return { dateKey, event };
}

export async function deleteSchedulerEvent(id: number | string): Promise<void> {
  const teamId = getTeamId();
  await apiRequest<void>(`/teams/${teamId}/content-posts/${id}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
