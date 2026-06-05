import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { SchedulerEvent, SchedulerEventMap, EventStatus } from "./scheduler.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

interface SocialAccountLite {
  id: number;
  channelId: number;
  platform: "Facebook" | "LinkedIn" | string;
  status: string;
}

function toEventStatus(contentStatus: string): EventStatus {
  if (contentStatus === "Review") return "Review";
  if (contentStatus === "Approved") return "Approved";
  if (contentStatus === "Scheduled") return "Scheduled";
  if (contentStatus === "Published") return "Published";
  if (contentStatus === "Archived") return "Archived";
  return "Draft";
}

function toContentStatus(eventStatus: EventStatus): "Draft" | "Review" | "Approved" | "Scheduled" | "Published" | "Archived" {
  if (eventStatus === "Review") return "Review";
  if (eventStatus === "Approved") return "Approved";
  if (eventStatus === "Scheduled") return "Scheduled";
  if (eventStatus === "Published") return "Published";
  if (eventStatus === "Archived") return "Archived";
  return "Draft";
}

function toContentType(platform: string): "FacebookPost" | "LinkedInPost" {
  return platform === "Facebook" ? "FacebookPost" : "LinkedInPost";
}

async function getDefaultActiveSocialAccount(teamId: string): Promise<SocialAccountLite> {
  const socialAccounts = await apiRequest<SocialAccountLite[]>(`/teams/${teamId}/social-accounts`, {
    requiresAuth: true,
  });

  const activeAccount = socialAccounts.find((account) => account.status === "Active");
  if (!activeAccount) {
    throw new Error("No active social account found. Connect Facebook or LinkedIn first.");
  }

  return activeAccount;
}

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
    
    const status = toEventStatus(post.status);

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
  const activeAccount = await getDefaultActiveSocialAccount(teamId);
  
  const rawData = {
    channelId: activeAccount.linkedChannelIds[0] ?? null,
    title: event.title,
    contentType: toContentType(activeAccount.platform),
    contentJson: JSON.stringify({ notes: event.notes, color: event.color }),
    prompt: `Scheduled from calendar: ${event.title}`,
    postVariants: [
      {
        platform: activeAccount.platform,
        contentJson: JSON.stringify({ notes: event.notes, color: event.color }),
        title: event.title,
      },
    ],
  };

  const createdPost = await apiRequest<any>(`/teams/${teamId}/content-posts`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(rawData),
  });

  // Scheduling requires the post to be publishable first.
  await apiRequest<any>(`/teams/${teamId}/content-posts/${createdPost.id}/workflow/transition`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ status: "Approved" }),
  });

  const [hours, minutes] = event.time.split(":").map(Number);
  const [yy, mm, dd] = dateKey.split("-").map(Number);
  const scheduledDate = new Date(Date.UTC(yy, mm - 1, dd, hours, minutes));

  await apiRequest<any>(`/teams/${teamId}/content-posts/${createdPost.id}/workflow/schedule`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      socialAccountId: activeAccount.id,
      postVariantId: null,
      scheduledAt: scheduledDate.toISOString(),
      idempotencyKey: `scheduler-${createdPost.id}-${scheduledDate.getTime()}`,
    }),
  });

  return { dateKey, event: { ...event, id: createdPost.id, status: "Scheduled" } };
}

export async function updateSchedulerEvent(dateKey: string, event: SchedulerEvent): Promise<{ dateKey: string; event: SchedulerEvent }> {
  const teamId = getTeamId();
  const activeAccount = await getDefaultActiveSocialAccount(teamId);
  
  const rawData = {
    channelId: activeAccount.linkedChannelIds[0] ?? null,
    title: event.title,
    contentType: toContentType(activeAccount.platform),
    contentJson: JSON.stringify({ notes: event.notes, color: event.color }),
    status: toContentStatus(event.status),
  };

  await apiRequest<any>(`/teams/${teamId}/content-posts/${event.id}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(rawData),
  });

  if (event.status === "Scheduled") {
    await apiRequest<any>(`/teams/${teamId}/content-posts/${event.id}/workflow/transition`, {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({ status: "Approved" }),
    });

    const [hours, minutes] = event.time.split(":").map(Number);
    const [yy, mm, dd] = dateKey.split("-").map(Number);
    const scheduledDate = new Date(Date.UTC(yy, mm - 1, dd, hours, minutes));

    await apiRequest<any>(`/teams/${teamId}/content-posts/${event.id}/workflow/schedule`, {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({
        socialAccountId: activeAccount.id,
        postVariantId: null,
        scheduledAt: scheduledDate.toISOString(),
        idempotencyKey: `scheduler-${event.id}-${scheduledDate.getTime()}`,
      }),
    });
  }

  return { dateKey, event };
}

export async function deleteSchedulerEvent(id: number | string): Promise<void> {
  const teamId = getTeamId();
  await apiRequest<void>(`/teams/${teamId}/content-posts/${id}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
