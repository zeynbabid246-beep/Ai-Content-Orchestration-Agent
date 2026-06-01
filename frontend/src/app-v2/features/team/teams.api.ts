import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type {
  TeamMember,
  InviteRequest,
  UpdateRoleRequest,
  UserTeamSummary,
  SwitchTeamResponse,
} from "./teams.type";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getMyTeams(): Promise<UserTeamSummary[]> {
  return apiRequest<UserTeamSummary[]>("/Team/mine", { requiresAuth: true });
}

export async function switchTeam(teamId: string): Promise<SwitchTeamResponse> {
  return apiRequest<SwitchTeamResponse>("/Team/switch", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({ teamId }),
  });
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const teamId = getTeamId();
  return apiRequest<TeamMember[]>(`/Team/${teamId}/members`, {
    requiresAuth: true,
  });
}

export async function inviteMember(payload: InviteRequest): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/Team/${teamId}/invite`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      username: payload.username,
      role: payload.role,
    }),
  });
}

export async function updateMemberRole(payload: UpdateRoleRequest): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/Team/${teamId}/members/role`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify({
      targetUserId: payload.targetUserId,
      role: payload.role,
    }),
  });
}

export async function removeMember(targetUserId: string): Promise<void> {
  const teamId = getTeamId();
  return apiRequest<void>(`/Team/${teamId}/members/${targetUserId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}