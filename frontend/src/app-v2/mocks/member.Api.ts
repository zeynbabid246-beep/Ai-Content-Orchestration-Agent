import type { Member } from "./memberteaams";

export async function getInvitedMembers(): Promise<Member[]> {
  return [
    {
      id: 1,
      name: "Siwar Attia",
      email: "siwar@acme.io",
      role: "Editor",
      status: "Accepted",
      initials: "SA",
      customColor: "#6366f1",
      invitedAt: "2026-04-10T10:00:00Z",
      lastActiveAt: "2026-04-16T09:12:00Z",
      platformsConnected: ["LinkedIn", "Instagram"],
      activity: [
        { id: "a1", type: "LOGIN",          description: "Logged into dashboard",                       timestamp: "2026-04-16T09:12:00Z" },
        { id: "a2", type: "POST_PUBLISHED", platform: "LinkedIn",  description: "Published: AI Trends Marketing Post",     timestamp: "2026-04-15T14:20:00Z" },
        { id: "a3", type: "POST_CREATED",   platform: "Instagram", description: 'Created draft "Behind the scenes at HQ"', timestamp: "2026-04-14T11:00:00Z" },
        { id: "a4", type: "LOGOUT",         description: "Logged out of dashboard",                     timestamp: "2026-04-13T18:00:00Z" },
      ],
    },
    {
      id: 2,
      name: "Nawal",
      email: "nawal@acme.io",
      role: "Viewer",
      status: "Invited",
      initials: "NA",
      customColor: "#f59e0b",
      invitedAt: "2026-04-14T08:00:00Z",
      platformsConnected: ["Facebook"],
      activity: [
        { id: "b1", type: "INVITE_SENT", description: "Invitation sent to nawal@acme.io", timestamp: "2026-04-14T08:00:00Z" },
      ],
    },
    {
      id: 3,
      name: "Karim Mansouri",
      email: "karim@brightscale.io",
      role: "Admin",
      status: "Accepted",
      initials: "KM",
      customColor: "#0284c7",
      invitedAt: "2026-02-20T08:30:00Z",
      lastActiveAt: "2026-04-16T09:15:00Z",
      platformsConnected: ["LinkedIn", "Facebook", "Instagram"],
      activity: [
        { id: "c1", type: "LOGIN",          description: "Logged into dashboard",                          timestamp: "2026-04-16T09:15:00Z" },
        { id: "c2", type: "POST_PUBLISHED", platform: "Facebook",  description: 'Published "Q2 Product Update"',            timestamp: "2026-04-15T16:40:00Z" },
        { id: "c3", type: "POST_CREATED",   platform: "LinkedIn",  description: 'Created draft "Team Spotlight: Engineering"', timestamp: "2026-04-14T11:20:00Z" },
        { id: "c4", type: "POST_PUBLISHED", platform: "Instagram", description: 'Published carousel "Product launch highlights"', timestamp: "2026-04-13T13:00:00Z" },
      ],
    },
    {
      id: 4,
      name: "Lina Trabelsi",
      email: "lina@novatech.io",
      role: "Editor",
      status: "Suspended",
      initials: "LT",
      customColor: "#b45309",
      invitedAt: "2026-01-05T10:00:00Z",
      lastActiveAt: "2026-03-28T15:00:00Z",
      platformsConnected: ["Instagram"],
      activity: [
        { id: "d1", type: "LOGIN",        description: "Logged into dashboard",                    timestamp: "2026-03-28T15:00:00Z" },
        { id: "d2", type: "POST_CREATED", platform: "Instagram", description: 'Created draft "Spring Collection Reveal"', timestamp: "2026-03-28T15:45:00Z" },
        { id: "d3", type: "LOGOUT",       description: "Logged out",                               timestamp: "2026-03-28T17:00:00Z" },
      ],
    },
  ];
}