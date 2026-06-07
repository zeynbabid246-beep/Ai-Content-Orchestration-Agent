import { apiRequest } from "../../shared/lib/http";

import { authStorage } from "../../shared/lib/storage";

import { getEffectiveContentStatus, toDisplayStatus } from "../content-posts/content-posts.display";

import type { ContentPost, ContentStatus } from "../content-posts/content-posts.types";

import type { CalendarEvent, CalendarEventMap, EventStatus } from "./calendar.types";



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

  linkedChannelIds?: number[];

}



function toEventStatus(contentStatus: ContentStatus): EventStatus {

  return toDisplayStatus(contentStatus);

}



function toContentType(platform: string): "FacebookPost" | "LinkedInPost" {

  return platform === "Facebook" ? "FacebookPost" : "LinkedInPost";

}



function toDateKey(scheduledAt: string): string {

  const dateObj = new Date(scheduledAt);

  const y = dateObj.getFullYear();

  const m = String(dateObj.getMonth() + 1).padStart(2, "0");

  const d = String(dateObj.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;

}



function toTime(scheduledAt: string): string {

  const dateObj = new Date(scheduledAt);

  const h = String(dateObj.getHours()).padStart(2, "0");

  const min = String(dateObj.getMinutes()).padStart(2, "0");

  return `${h}:${min}`;

}



function mapPostToEvent(post: ContentPost, campaignNameById: Map<number, string>): CalendarEvent {

  const campaignName =

    post.campaignName ??

    (post.campaignId != null ? campaignNameById.get(post.campaignId) : undefined) ??

    null;



  return {

    id: post.id,

    title: post.title || "Untitled",

    time: toTime(post.scheduledAt!),

    status: toEventStatus(getEffectiveContentStatus(post)),

    campaignId: post.campaignId ?? null,

    campaignName,

    channelId: post.channelId ?? null,

    isStandalone: post.campaignId == null,

  };

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



export async function getCalendarEvents(

  campaignNameById: Map<number, string> = new Map()

): Promise<CalendarEventMap> {

  const teamId = getTeamId();

  const posts = await apiRequest<ContentPost[]>(`/teams/${teamId}/content-posts`, {

    requiresAuth: true,

  });



  const map: CalendarEventMap = {};



  for (const post of posts) {

    if (!post.scheduledAt) continue;



    const dateKey = toDateKey(post.scheduledAt);

    const event = mapPostToEvent(post, campaignNameById);



    if (!map[dateKey]) map[dateKey] = [];

    map[dateKey].push(event);

  }



  for (const dateKey of Object.keys(map)) {

    map[dateKey].sort((a, b) => a.time.localeCompare(b.time));

  }



  return map;

}



export async function createCalendarEvent(

  dateKey: string,

  event: { title: string; time: string; status: EventStatus; notes?: string }

): Promise<{ dateKey: string; event: CalendarEvent }> {

  const teamId = getTeamId();

  const activeAccount = await getDefaultActiveSocialAccount(teamId);



  const rawData = {

    channelId: activeAccount.linkedChannelIds?.[0] ?? activeAccount.channelId ?? null,

    title: event.title,

    contentType: toContentType(activeAccount.platform),

    contentJson: JSON.stringify({ notes: event.notes ?? "" }),

    prompt: `Scheduled from calendar: ${event.title}`,

    postVariants: [

      {

        platform: activeAccount.platform,

        contentJson: JSON.stringify({ notes: event.notes ?? "" }),

        title: event.title,

      },

    ],

  };



  const createdPost = await apiRequest<ContentPost>(`/teams/${teamId}/content-posts`, {

    method: "POST",

    requiresAuth: true,

    body: JSON.stringify(rawData),

  });



  await apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${createdPost.id}/workflow/ready`, {

    method: "POST",

    requiresAuth: true,

  });



  const [hours, minutes] = event.time.split(":").map(Number);

  const [yy, mm, dd] = dateKey.split("-").map(Number);

  const scheduledDate = new Date(Date.UTC(yy, mm - 1, dd, hours, minutes));



  await apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${createdPost.id}/workflow/schedule`, {

    method: "POST",

    requiresAuth: true,

    body: JSON.stringify({

      socialAccountId: activeAccount.id,

      postVariantId: null,

      scheduledAt: scheduledDate.toISOString(),

      idempotencyKey: `calendar-${createdPost.id}-${scheduledDate.getTime()}`,

    }),

  });



  const calendarEvent: CalendarEvent = {

    id: createdPost.id,

    title: event.title,

    time: event.time,

    status: "Scheduled",

    campaignId: null,

    campaignName: null,

    channelId: createdPost.channelId ?? null,

    isStandalone: true,

  };



  return { dateKey, event: calendarEvent };

}



export async function updateCalendarEvent(

  dateKey: string,

  event: CalendarEvent & { notes?: string }

): Promise<{ dateKey: string; event: CalendarEvent }> {

  const teamId = getTeamId();

  const activeAccount = await getDefaultActiveSocialAccount(teamId);



  const rawData = {

    channelId: activeAccount.linkedChannelIds?.[0] ?? activeAccount.channelId ?? null,

    title: event.title,

    contentType: toContentType(activeAccount.platform),

    contentJson: JSON.stringify({ notes: event.notes ?? "" }),

  };



  await apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${event.id}`, {

    method: "PUT",

    requiresAuth: true,

    body: JSON.stringify(rawData),

  });



  if (event.status === "Scheduled") {

    await apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${event.id}/workflow/ready`, {

      method: "POST",

      requiresAuth: true,

    });



    const [hours, minutes] = event.time.split(":").map(Number);

    const [yy, mm, dd] = dateKey.split("-").map(Number);

    const scheduledDate = new Date(Date.UTC(yy, mm - 1, dd, hours, minutes));



    await apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${event.id}/workflow/schedule`, {

      method: "POST",

      requiresAuth: true,

      body: JSON.stringify({

        socialAccountId: activeAccount.id,

        postVariantId: null,

        scheduledAt: scheduledDate.toISOString(),

        idempotencyKey: `calendar-${event.id}-${scheduledDate.getTime()}`,

      }),

    });

  }



  return { dateKey, event };

}



export async function deleteCalendarEvent(id: number): Promise<void> {

  const teamId = getTeamId();

  await apiRequest<void>(`/teams/${teamId}/content-posts/${id}`, {

    method: "DELETE",

    requiresAuth: true,

  });

}

