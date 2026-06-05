import { apiFormRequest, apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";

export type Profile = {
  userId: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  teamRole: string;
  teamName: string;
  memberSince: string;
};

export type UpdateProfilePayload = {
  username: string;
  bio: string;
};

type ApiProfile = {
  userId: string;
  username: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  teamRole: string;
  teamName: string;
  memberSince: string;
};

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

function mapProfile(data: ApiProfile): Profile {
  return {
    userId: data.userId,
    username: data.username,
    email: data.email,
    bio: data.bio ?? "",
    avatarUrl: data.avatarUrl ?? null,
    teamRole: data.teamRole,
    teamName: data.teamName,
    memberSince: data.memberSince,
  };
}

export async function getProfile(): Promise<Profile> {
  const teamId = getTeamId();
  const data = await apiRequest<ApiProfile>(`/Profile/me?teamId=${encodeURIComponent(teamId)}`, {
    requiresAuth: true,
  });
  return mapProfile(data);
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
  const teamId = getTeamId();
  const userId = authStorage.getUserId() ?? "";
  const data = await apiRequest<ApiProfile>(
    `/Profile/me?teamId=${encodeURIComponent(teamId)}`,
    {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify({
        username: payload.username.trim(),
        bio: payload.bio.trim() || null,
      }),
    }
  );
  authStorage.setUser(userId, data.username, data.email);
  return mapProfile(data);
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFormRequest<{ url: string }>("/Profile/avatar", formData);
}

export async function removeAvatar(): Promise<void> {
  await apiRequest<void>("/Profile/avatar", {
    method: "DELETE",
    requiresAuth: true,
  });
}
