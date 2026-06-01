// src/app-v2/features/team/teams.type.ts

export type TeamRole = "Admin" | "Editor" | "Viewer";

export type UserTeamSummary = {
  teamId: string;
  teamName: string;
  role: TeamRole;
  joinedAt: string;
};

export type SwitchTeamResponse = {
  teamId: string;
  teamName: string;
  teamRole: TeamRole;
};

export interface TeamMember {
  userId: string;
  username: string;
  role: TeamRole;
  joinedAt: string;
}

export interface InviteRequest {
  username: string;
  role: "Editor" | "Viewer";
}

export interface UpdateRoleRequest {
  targetUserId: string;
  role: TeamRole;
}

// ─── For MembersHistoryPage (activity history) ────────────────────────────────

export type Platform = "LinkedIn" | "Facebook" | "Instagram";

export type MemberStatus = "Invited" | "Accepted" | "Rejected" | "Suspended";

export interface MemberActivity {
  id: string;
  type: "LOGIN" | "LOGOUT" | "POST_CREATED" | "POST_PUBLISHED" | "INVITE_SENT";
  platform?: Platform;
  description: string;
  timestamp: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  initials: string;
  customColor: string;
  invitedAt: string;
  lastActiveAt?: string;
  platformsConnected: Platform[];
  activity: MemberActivity[];
}