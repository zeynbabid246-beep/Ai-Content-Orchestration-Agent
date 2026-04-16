export type Platform = "LinkedIn" | "Facebook" | "Instagram";

export type MemberStatus =
  | "Invited"
  | "Accepted"
  | "Rejected"
  | "Suspended";

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
  role: "Editor" | "Viewer" | "Admin" ;
  status: MemberStatus;

  initials: string;
  customColor: string;

  invitedAt: string;
  lastActiveAt?: string;

  platformsConnected: Platform[];

  activity: MemberActivity[];
}