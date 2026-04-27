import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { 
  ContentPost, 
  CreateContentPostRequest, 
  UpdateContentPostRequest,
  TransitionContentPostStatusRequest,
  ScheduleContentPostRequest,
  PublishContentPostRequest 
} from "./content-posts.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getContentPosts(): Promise<ContentPost[]> {
  const teamId = getTeamId();
  return apiRequest<ContentPost[]>(`/teams/${teamId}/content-posts`, {
    requiresAuth: true,
  });
}

export async function getContentPostById(contentPostId: number): Promise<ContentPost> {
  const teamId = getTeamId();
  return apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${contentPostId}`, {
    requiresAuth: true,
  });
}

export async function createContentPost(payload: CreateContentPostRequest): Promise<ContentPost> {
  const teamId = getTeamId();
  return apiRequest<ContentPost>(`/teams/${teamId}/content-posts`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function updateContentPost(contentPostId: number, payload: UpdateContentPostRequest): Promise<ContentPost> {
  const teamId = getTeamId();
  return apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${contentPostId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function deleteContentPost(contentPostId: number): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/content-posts/${contentPostId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

export async function transitionContentPostStatus(contentPostId: number, payload: TransitionContentPostStatusRequest): Promise<ContentPost> {
  const teamId = getTeamId();
  return apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${contentPostId}/workflow/transition`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function scheduleContentPost(contentPostId: number, payload: ScheduleContentPostRequest): Promise<ContentPost> {
  const teamId = getTeamId();
  return apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${contentPostId}/workflow/schedule`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function publishContentPost(contentPostId: number, payload: PublishContentPostRequest): Promise<ContentPost> {
  const teamId = getTeamId();
  return apiRequest<ContentPost>(`/teams/${teamId}/content-posts/${contentPostId}/workflow/publish`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}
