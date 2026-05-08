import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { Channel, CreateChannelRequest, UpdateChannelRequest } from "./channels.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getChannels(): Promise<Channel[]> {
  const teamId = getTeamId();
  return apiRequest<Channel[]>(`/teams/${teamId}/channels`, {
    requiresAuth: true,
  });
}

export async function getChannelById(channelId: number): Promise<Channel> {
  const teamId = getTeamId();
  return apiRequest<Channel>(`/teams/${teamId}/channels/${channelId}`, {
    requiresAuth: true,
  });
}

export async function createChannel(payload: CreateChannelRequest): Promise<Channel> {
  const teamId = getTeamId();
  return apiRequest<Channel>(`/teams/${teamId}/channels`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      name: payload.name,
      description: payload.description ?? null,
      branding: {
        logoUrl: payload.branding?.logoUrl ?? null,
        theme: payload.branding?.theme ?? "default",
        slogan: payload.branding?.slogan ?? null,
        tone: payload.branding?.tone ?? "professional",
      },
      config: {
        settingsJson:
          payload.config?.settingsJson ??
          JSON.stringify({
            timezone: "UTC",
          }),
      },
    }),
  });
}

export async function updateChannel(channelId: number, payload: UpdateChannelRequest): Promise<Channel> {
  const teamId = getTeamId();
  return apiRequest<Channel>(`/teams/${teamId}/channels/${channelId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify({
      name: payload.name,
      description: payload.description ?? null,
      branding: {
        logoUrl: payload.branding?.logoUrl ?? null,
        theme: payload.branding?.theme ?? "default",
        slogan: payload.branding?.slogan ?? null,
        tone: payload.branding?.tone ?? "professional",
      },
      config: {
        settingsJson:
          payload.config?.settingsJson ??
          JSON.stringify({
            timezone: "UTC",
          }),
      },
    }),
  });
}

export async function deleteChannel(channelId: number): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/teams/${teamId}/channels/${channelId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}